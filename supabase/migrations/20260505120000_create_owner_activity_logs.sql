-- Create activity_type enum
create type "public"."activity_type" as enum ('signup', 'signin', 'account_activated', 'account_deactivated', 'profile_updated', 'account_deleted', 'signin_failed');

-- Create owner_activity_logs table
create table "public"."owner_activity_logs" (
  "id" uuid not null default gen_random_uuid(),
  "owner_id" uuid not null,
  "activity_type" public.activity_type not null,
  "description" text,
  "ip_address" text,
  "user_agent" text,
  "status" text default 'success',
  "created_at" timestamp with time zone default now()
);

alter table "public"."owner_activity_logs" enable row level security;

CREATE UNIQUE INDEX owner_activity_logs_pkey ON public.owner_activity_logs USING btree (id);

alter table "public"."owner_activity_logs" add constraint "owner_activity_logs_pkey" PRIMARY KEY using index "owner_activity_logs_pkey";

alter table "public"."owner_activity_logs" add constraint "owner_activity_logs_owner_id_fkey" 
FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON DELETE CASCADE not valid;

alter table "public"."owner_activity_logs" validate constraint "owner_activity_logs_owner_id_fkey";

-- Create index for faster queries
CREATE INDEX owner_activity_logs_owner_id_idx ON public.owner_activity_logs(owner_id);
CREATE INDEX owner_activity_logs_created_at_idx ON public.owner_activity_logs(created_at DESC);
CREATE INDEX owner_activity_logs_activity_type_idx ON public.owner_activity_logs(activity_type);

-- RLS Policies for owner_activity_logs
create policy "Admins can view all activity logs"
on "public"."owner_activity_logs"
as permissive
for select
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'admin'
  )
);

create policy "Owners can view their own activity logs"
on "public"."owner_activity_logs"
as permissive
for select
using (
  owner_id = auth.uid()
);

create policy "Service role can insert activity logs"
on "public"."owner_activity_logs"
as permissive
for insert
with check (true);

-- Add helper function to log activity
create or replace function public.log_owner_activity(
  owner_id uuid,
  activity_type public.activity_type,
  description text default null,
  ip_address text default null,
  user_agent text default null,
  status text default 'success'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.owner_activity_logs (owner_id, activity_type, description, ip_address, user_agent, status)
  values (owner_id, activity_type, description, ip_address, user_agent, status);
end;
$$;

-- Create last_signin_at column in owners table
alter table "public"."owners" add column "last_signin_at" timestamp with time zone;
alter table "public"."owners" add column "signin_count" integer default 0;

-- Create index for last_signin_at
CREATE INDEX owners_last_signin_at_idx ON public.owners(last_signin_at DESC);
