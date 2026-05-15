-- Profiles + subscriptions (subscription access model)
-- Extends existing owners / auth without breaking FKs.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid not null primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  role public.app_role not null default 'owner'::public.app_role,
  account_status text not null default 'pending'
    constraint profiles_account_status_check
    check (account_status in ('pending', 'active', 'suspended')),
  subscription_status text not null default 'trial'
    constraint profiles_subscription_status_check
    check (subscription_status in ('trial', 'active', 'expired', 'suspended')),
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_expires_at timestamptz,
  trial_popup_acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_account_status_idx on public.profiles (account_status);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id text not null,
  payment_id text,
  amount numeric(12, 2) not null,
  payment_status text not null default 'pending'
    constraint subscriptions_payment_status_check
    check (payment_status in ('pending', 'success', 'failed')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  is_first_purchase boolean not null default true,
  created_at timestamptz not null default now(),
  constraint subscriptions_order_id_key unique (order_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_user_payment_idx
  on public.subscriptions (user_id, payment_status);

alter table public.subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- Prevent owners from changing subscription fields (admins bypass via policy)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_owner_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_role(auth.uid(), 'admin'::public.app_role) then
    return new;
  end if;

  if tg_op = 'UPDATE' and auth.uid() = new.id then
    if new.subscription_status is distinct from old.subscription_status
      or new.account_status is distinct from old.account_status
      or new.subscription_expires_at is distinct from old.subscription_expires_at
      or new.trial_start_date is distinct from old.trial_start_date
      or new.trial_end_date is distinct from old.trial_end_date
      or new.role is distinct from old.role
      or new.email is distinct from old.email
      or new.id is distinct from old.id
    then
      raise exception 'not allowed' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_owner_updates_trg on public.profiles;
create trigger profiles_guard_owner_updates_trg
before update on public.profiles
for each row
execute function public.profiles_guard_owner_updates();

-- ---------------------------------------------------------------------------
-- Backfill profiles from existing owners
-- ---------------------------------------------------------------------------
insert into public.profiles (
  id,
  full_name,
  email,
  phone,
  role,
  account_status,
  subscription_status,
  trial_start_date,
  trial_end_date,
  subscription_expires_at,
  trial_popup_acknowledged,
  created_at
)
select
  o.id,
  coalesce(nullif(trim(o.business_name), ''), split_part(o.email, '@', 1)),
  o.email,
  coalesce(o.phone, ''),
  'owner'::public.app_role,
  case when o.is_active then 'active' else 'pending' end,
  case when o.is_active then 'active' else 'expired' end,
  case when o.is_active then o.created_at else null end,
  case when o.is_active then o.created_at + interval '14 days' else null end,
  case when o.is_active then now() + interval '365 days' else null end,
  true,
  o.created_at
from public.owners o
where not exists (select 1 from public.profiles p where p.id = o.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- New auth users: active owner row + trial profile (14 days)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full text := coalesce(
    nullif(trim(meta ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_phone text := coalesce(nullif(trim(meta ->> 'phone'), ''), '');
begin
  insert into public.owners (id, email, is_active, phone)
  values (new.id, new.email, true, nullif(v_phone, ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'owner');

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    account_status,
    subscription_status,
    trial_start_date,
    trial_end_date,
    trial_popup_acknowledged
  )
  values (
    new.id,
    v_full,
    new.email,
    v_phone,
    'owner'::public.app_role,
    'active',
    'trial',
    now(),
    now() + interval '14 days',
    false
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_active_owner: owners row active AND profile account active
-- ---------------------------------------------------------------------------
create or replace function public.is_active_owner(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.owners o
    inner join public.profiles p on p.id = o.id
    where o.id = _user_id
      and o.is_active = true
      and p.account_status = 'active'
  );
$function$;

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to public
using ((auth.uid() = id) or public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "profiles_insert_own"
on public.profiles
for insert
to public
with check (auth.uid() = id);

create policy "profiles_update_own_non_entitlement"
on public.profiles
for update
to public
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_admin_all"
on public.profiles
for all
to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- RLS: subscriptions (no client access; Edge Functions use service role)
-- ---------------------------------------------------------------------------
create policy "subscriptions_deny_authenticated"
on public.subscriptions
for all
to authenticated
using (false)
with check (false);

create policy "subscriptions_deny_anon"
on public.subscriptions
for all
to anon
using (false)
with check (false);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant all on public.subscriptions to service_role;
