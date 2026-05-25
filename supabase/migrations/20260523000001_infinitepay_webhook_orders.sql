ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS capture_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_nsu text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_slug text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url text;
