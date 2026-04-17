
-- Extend promotions table for advanced engine
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS label_color text DEFAULT '#ef4444',
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS volume_tiers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spend_tiers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS applies_to_products text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS product_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_product_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_category_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applies_to_customers text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS customer_group_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS new_customers_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS registered_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_payment_method text,
  ADD COLUMN IF NOT EXISTS active_days integer[] DEFAULT '{0,1,2,3,4,5,6}',
  ADD COLUMN IF NOT EXISTS active_hour_start integer,
  ADD COLUMN IF NOT EXISTS active_hour_end integer,
  ADD COLUMN IF NOT EXISTS show_countdown boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS no_combine boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_orders integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_discount_given numeric DEFAULT 0;

-- Create index for active promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active_status ON public.promotions(status, active);
