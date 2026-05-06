-- Add QR code URL column to owners table
ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
