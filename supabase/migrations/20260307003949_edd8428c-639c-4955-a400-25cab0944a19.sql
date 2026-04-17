
-- Extend coupons table with advanced features
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS applies_to text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS category_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_quantity integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS customer_scope text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS customer_group_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specific_customer_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS combine_with_promotions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS combine_with_codes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS includes_free_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_code_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revenue_generated numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_discount_given numeric NOT NULL DEFAULT 0;

-- Index for bulk code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_parent ON public.coupons(parent_code_id) WHERE parent_code_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;
