-- Orders: customer type and company data
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'pf' CHECK (customer_type IN ('pf','pj')),
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_cui text,
  ADD COLUMN IF NOT EXISTS company_reg_com text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS billing_different boolean NOT NULL DEFAULT false;

-- Addresses: split first/last name (keep full_name for backward compat)
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Index for filtering B2B orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_type ON public.orders(customer_type);
CREATE INDEX IF NOT EXISTS idx_orders_company_cui ON public.orders(company_cui) WHERE company_cui IS NOT NULL;