
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS extra_fee_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS extra_fee_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowed_counties text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allowed_customer_groups uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_details jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pickup_location_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_deadline_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sandbox_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_saved_cards boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bnpl_config jsonb DEFAULT NULL;
