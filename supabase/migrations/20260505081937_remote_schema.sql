drop extension if exists "pg_net";

create type "public"."app_role" as enum ('admin', 'owner');

create type "public"."invoice_status" as enum ('paid', 'unpaid', 'partial');


  create table "public"."invoice_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "product_id" uuid,
    "product_name" text not null,
    "quantity" numeric not null,
    "cost_price" numeric default 0,
    "selling_price" numeric default 0,
    "gst_rate" numeric default 0,
    "cgst" numeric default 0,
    "sgst" numeric default 0,
    "total_price" numeric default 0,
    "profit" numeric default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."invoice_items" enable row level security;


  create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "invoice_no" text not null,
    "customer_name" text not null,
    "customer_phone" text,
    "customer_gstin" text,
    "customer_address" text,
    "subtotal" numeric default 0,
    "discount" numeric default 0,
    "cgst_total" numeric default 0,
    "sgst_total" numeric default 0,
    "total_amount" numeric default 0,
    "final_amount" numeric default 0,
    "paid_amount" numeric default 0,
    "due_amount" numeric default 0,
    "gst_enabled" boolean default false,
    "profit" numeric default 0,
    "status" public.invoice_status default 'unpaid'::public.invoice_status,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."invoices" enable row level security;


  create table "public"."owners" (
    "id" uuid not null,
    "email" text not null,
    "business_name" text,
    "address" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "phone" text,
    "gst_number" text,
    "pan_number" text,
    "logo_url" text,
    "signature_url" text,
    "is_active" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "bank_holder" text,
    "bank_name" text,
    "bank_account" text,
    "bank_branch" text,
    "bank_ifsc" text
      );


alter table "public"."owners" enable row level security;


  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "name" text not null,
    "hsn_code" text,
    "stock_qty" numeric default 0,
    "cost_price" numeric default 0,
    "selling_price" numeric default 0,
    "gst_rate" numeric default 18,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."products" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" public.app_role not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX owners_pkey ON public.owners USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."owners" add constraint "owners_pkey" PRIMARY KEY using index "owners_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."owners" add constraint "owners_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."owners" validate constraint "owners_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.deduct_stock_on_item_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_qty = stock_qty - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.owners (id, email, is_active)
  VALUES (NEW.id, NEW.email, FALSE);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_active_owner(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.owners
    WHERE id = _user_id AND is_active = TRUE
  )
$function$
;

CREATE OR REPLACE FUNCTION public.next_invoice_no(_owner_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  prefix TEXT := 'INV-' || yr || '-';
  next_num INT;
BEGIN
  SELECT COALESCE(MAX( (regexp_replace(invoice_no, '^INV-\d{4}-', ''))::INT ), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE owner_id = _owner_id
    AND invoice_no LIKE prefix || '%';

  RETURN prefix || lpad(next_num::TEXT, 4, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_to_admin(admin_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove owner role if exists
  DELETE FROM public.user_roles
  WHERE user_id = (SELECT id FROM auth.users WHERE email = admin_email)
    AND role = 'owner';

  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::app_role
  FROM auth.users
  WHERE email = admin_email
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."invoice_items" to "anon";

grant insert on table "public"."invoice_items" to "anon";

grant references on table "public"."invoice_items" to "anon";

grant select on table "public"."invoice_items" to "anon";

grant trigger on table "public"."invoice_items" to "anon";

grant truncate on table "public"."invoice_items" to "anon";

grant update on table "public"."invoice_items" to "anon";

grant delete on table "public"."invoice_items" to "authenticated";

grant insert on table "public"."invoice_items" to "authenticated";

grant references on table "public"."invoice_items" to "authenticated";

grant select on table "public"."invoice_items" to "authenticated";

grant trigger on table "public"."invoice_items" to "authenticated";

grant truncate on table "public"."invoice_items" to "authenticated";

grant update on table "public"."invoice_items" to "authenticated";

grant delete on table "public"."invoice_items" to "service_role";

grant insert on table "public"."invoice_items" to "service_role";

grant references on table "public"."invoice_items" to "service_role";

grant select on table "public"."invoice_items" to "service_role";

grant trigger on table "public"."invoice_items" to "service_role";

grant truncate on table "public"."invoice_items" to "service_role";

grant update on table "public"."invoice_items" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."owners" to "anon";

grant insert on table "public"."owners" to "anon";

grant references on table "public"."owners" to "anon";

grant select on table "public"."owners" to "anon";

grant trigger on table "public"."owners" to "anon";

grant truncate on table "public"."owners" to "anon";

grant update on table "public"."owners" to "anon";

grant delete on table "public"."owners" to "authenticated";

grant insert on table "public"."owners" to "authenticated";

grant references on table "public"."owners" to "authenticated";

grant select on table "public"."owners" to "authenticated";

grant trigger on table "public"."owners" to "authenticated";

grant truncate on table "public"."owners" to "authenticated";

grant update on table "public"."owners" to "authenticated";

grant delete on table "public"."owners" to "service_role";

grant insert on table "public"."owners" to "service_role";

grant references on table "public"."owners" to "service_role";

grant select on table "public"."owners" to "service_role";

grant trigger on table "public"."owners" to "service_role";

grant truncate on table "public"."owners" to "service_role";

grant update on table "public"."owners" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


  create policy "Admins manage all invoice items"
  on "public"."invoice_items"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Owners delete own invoice items"
  on "public"."invoice_items"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.owner_id = auth.uid()) AND public.is_active_owner(auth.uid())))));



  create policy "Owners insert own invoice items"
  on "public"."invoice_items"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.owner_id = auth.uid()) AND public.is_active_owner(auth.uid())))));



  create policy "Owners update own invoice items"
  on "public"."invoice_items"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.owner_id = auth.uid()) AND public.is_active_owner(auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.owner_id = auth.uid()) AND public.is_active_owner(auth.uid())))));



  create policy "Owners view own invoice items"
  on "public"."invoice_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.owner_id = auth.uid()) AND public.is_active_owner(auth.uid())))));



  create policy "Admins manage all invoices"
  on "public"."invoices"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Owners delete own invoices"
  on "public"."invoices"
  as permissive
  for delete
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners insert own invoices"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners update own invoices"
  on "public"."invoices"
  as permissive
  for update
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())))
with check (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners view own invoices"
  on "public"."invoices"
  as permissive
  for select
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Admins can manage all owners"
  on "public"."owners"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Admins can view all owners"
  on "public"."owners"
  as permissive
  for select
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Owners can update their own profile"
  on "public"."owners"
  as permissive
  for update
  to public
using (((auth.uid() = id) AND (is_active = true)))
with check (((auth.uid() = id) AND (is_active = true)));



  create policy "Owners can view their own profile"
  on "public"."owners"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Admins manage all products"
  on "public"."products"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Owners delete own products"
  on "public"."products"
  as permissive
  for delete
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners insert own products"
  on "public"."products"
  as permissive
  for insert
  to public
with check (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners update own products"
  on "public"."products"
  as permissive
  for update
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())))
with check (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Owners view own products"
  on "public"."products"
  as permissive
  for select
  to public
using (((auth.uid() = owner_id) AND public.is_active_owner(auth.uid())));



  create policy "Admins can manage roles"
  on "public"."user_roles"
  as permissive
  for all
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Admins can view all roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using (public.has_role(auth.uid(), 'admin'::public.app_role));



  create policy "Users can view their own roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER on_invoice_item_insert AFTER INSERT ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_item_insert();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admins can manage all logos"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'logos'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role))))));



  create policy "Admins can manage all signatures"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'signatures'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role))))));



  create policy "Owners can read own logo"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Owners can read own signature"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'signatures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Owners can upload own logo"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Owners can upload own signature"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'signatures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



