-- Add barcode field to products table
alter table "public"."products" add column "barcode" text unique;
alter table "public"."products" add column "barcode_type" text default 'code128';

-- Create index on barcode for fast lookup
create index "idx_products_barcode" on "public"."products" using btree (barcode);
create index "idx_products_owner_barcode" on "public"."products" using btree (owner_id, barcode);

-- Create barcode_logs table for tracking barcode generations
create table "public"."barcode_logs" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid not null references "public"."products"(id) on delete cascade,
  "owner_id" uuid not null,
  "barcode" text not null,
  "generated_at" timestamp with time zone default now(),
  "action" text, -- 'generated', 'regenerated', 'imported'
  primary key (id)
);

alter table "public"."barcode_logs" enable row level security;

-- Create unique index on barcode_logs
create unique index "idx_barcode_logs_pkey" on "public"."barcode_logs" using btree (id);
create index "idx_barcode_logs_product_id" on "public"."barcode_logs" using btree (product_id);
create index "idx_barcode_logs_owner_id" on "public"."barcode_logs" using btree (owner_id);

-- Update invoice_items to include barcode and hsn_code
alter table "public"."invoice_items" add column "hsn_code" text;
alter table "public"."invoice_items" add column "barcode" text;

-- Create RPC function to generate unique barcode
create or replace function generate_unique_barcode(p_owner_id uuid)
returns text as $$
declare
  v_barcode text;
  v_attempts int := 0;
  v_max_attempts int := 100;
begin
  loop
    v_attempts := v_attempts + 1;
    if v_attempts > v_max_attempts then
      raise exception 'Failed to generate unique barcode after % attempts', v_max_attempts;
    end if;
    
    -- Generate random barcode (12 digits for UPC-style, 13 for EAN-style)
    v_barcode := lpad((floor(random() * 9999999999999)::bigint)::text, 13, '0');
    
    -- Check if barcode already exists for this owner
    if not exists(
      select 1 from products 
      where owner_id = p_owner_id and barcode = v_barcode
    ) then
      return v_barcode;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- RPC function to find product by barcode
create or replace function find_product_by_barcode(p_barcode text, p_owner_id uuid)
returns table(
  id uuid,
  name text,
  selling_price numeric,
  cost_price numeric,
  gst_rate numeric,
  hsn_code text,
  stock_qty numeric,
  owner_id uuid
) as $$
begin
  return query
  select 
    products.id,
    products.name,
    products.selling_price,
    products.cost_price,
    products.gst_rate,
    products.hsn_code,
    products.stock_qty,
    products.owner_id
  from products
  where products.barcode = p_barcode 
    and products.owner_id = p_owner_id
  limit 1;
end;
$$ language plpgsql security definer;

-- RLS Policies for barcode_logs
create policy "Users can view own barcode logs"
  on "public"."barcode_logs"
  for select
  using (owner_id = auth.uid() or exists (
    select 1 from owners where id = auth.uid() and id = owner_id
  ));

create policy "Service role can insert barcode logs"
  on "public"."barcode_logs"
  for insert
  with check (true);

-- Add comment
comment on column products.barcode is 'Unique barcode for product (Code128, EAN-13)';
comment on column products.barcode_type is 'Type of barcode encoding (code128, ean13, etc)';
comment on function generate_unique_barcode is 'Generates a unique barcode for a given owner';
comment on function find_product_by_barcode is 'Finds a product by barcode for a specific owner';
