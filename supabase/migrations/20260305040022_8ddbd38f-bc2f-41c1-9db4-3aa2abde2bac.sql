
-- SmartBill sync log table
CREATE TABLE IF NOT EXISTS public.smartbill_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'create_invoice',
  smartbill_number text,
  smartbill_url text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smartbill_sync_log ENABLE ROW LEVEL SECURITY;

-- Add SmartBill columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS smartbill_number text,
  ADD COLUMN IF NOT EXISTS smartbill_url text,
  ADD COLUMN IF NOT EXISTS smartbill_status text DEFAULT NULL;

-- Add SmartBill columns to products  
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS smartbill_code text,
  ADD COLUMN IF NOT EXISTS smartbill_meas_unit text DEFAULT 'buc',
  ADD COLUMN IF NOT EXISTS smartbill_vat_rate numeric DEFAULT 19;

-- Add SmartBill client ID to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS smartbill_client_id text;
