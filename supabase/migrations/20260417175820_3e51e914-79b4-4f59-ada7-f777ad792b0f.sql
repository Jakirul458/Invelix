
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'owner');
CREATE TYPE public.invoice_status AS ENUM ('paid', 'unpaid', 'partial');

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- USER ROLES (separate table — never on profiles)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- OWNERS (business profile)
-- =====================================================
CREATE TABLE public.owners (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  gst_number TEXT,
  pan_number TEXT,
  logo_url TEXT,
  signature_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_owners_updated_at
  BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Owners can view their own profile"
  ON public.owners FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Owners can update their own profile"
  ON public.owners FOR UPDATE
  USING (auth.uid() = id AND is_active = TRUE);

CREATE POLICY "Admins can view all owners"
  ON public.owners FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all owners"
  ON public.owners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- AUTO-CREATE OWNER + ROLE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.owners (id, email, is_active)
  VALUES (NEW.id, NEW.email, FALSE);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stock_qty NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC DEFAULT 18,
  hsn_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_owner ON public.products(owner_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: only active owners can do CRUD
CREATE OR REPLACE FUNCTION public.is_active_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owners
    WHERE id = _user_id AND is_active = TRUE
  )
$$;

CREATE POLICY "Owners view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Admins manage all products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  invoice_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  gst_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  cgst_total NUMERIC NOT NULL DEFAULT 0,
  sgst_total NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_amount NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0, -- INTERNAL ONLY
  status invoice_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, invoice_no)
);

CREATE INDEX idx_invoices_owner ON public.invoices(owner_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_created ON public.invoices(created_at DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Owners view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Owners delete own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = owner_id AND public.is_active_owner(auth.uid()));

CREATE POLICY "Admins manage all invoices"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- INVOICE ITEMS
-- =====================================================
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 0,
  cgst NUMERIC NOT NULL DEFAULT 0,
  sgst NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0, -- INTERNAL ONLY
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON public.invoice_items(product_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
      AND i.owner_id = auth.uid()
      AND public.is_active_owner(auth.uid())
  ));

CREATE POLICY "Owners insert own invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
      AND i.owner_id = auth.uid()
      AND public.is_active_owner(auth.uid())
  ));

CREATE POLICY "Owners delete own invoice items"
  ON public.invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
      AND i.owner_id = auth.uid()
      AND public.is_active_owner(auth.uid())
  ));

CREATE POLICY "Admins manage all invoice items"
  ON public.invoice_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- AUTO STOCK DEDUCTION ON INVOICE ITEM INSERT
-- =====================================================
CREATE OR REPLACE FUNCTION public.deduct_stock_on_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_qty = stock_qty - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_item_insert();

-- =====================================================
-- INVOICE NUMBER GENERATOR (year-prefixed, per owner)
-- =====================================================
CREATE OR REPLACE FUNCTION public.next_invoice_no(_owner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- =====================================================
-- STORAGE BUCKETS (private)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false),
       ('logos', 'logos', false);

-- Signatures: owners manage their own folder
CREATE POLICY "Owners read own signatures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners upload own signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners update own signatures"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners delete own signatures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Logos: same pattern
CREATE POLICY "Owners read own logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners upload own logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners update own logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners delete own logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins: full storage access for both buckets
CREATE POLICY "Admins all signatures"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('signatures','logos') AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id IN ('signatures','logos') AND public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- ADMIN USER CREATION & MANAGEMENT
-- =====================================================
-- IMPORTANT: When creating admin users manually via auth, remove the auto-assigned 'owner' role
-- by running: DELETE FROM public.user_roles WHERE user_id = <admin_user_id> AND role = 'owner'
-- Then add only admin role: INSERT INTO public.user_roles (user_id, role) VALUES (<admin_user_id>, 'admin')

-- Function to safely promote an existing user to admin (removes owner role)
CREATE OR REPLACE FUNCTION public.promote_to_admin(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Make jakirulsk312@gmail.com an admin
SELECT public.promote_to_admin('jakirulsk312@gmail.com');
