
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_wrapping jsonb DEFAULT null;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'RON';
