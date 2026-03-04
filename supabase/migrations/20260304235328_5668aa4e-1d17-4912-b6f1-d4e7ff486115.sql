
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 10,
  
  -- Applies to products
  applies_to_products text NOT NULL DEFAULT 'all', -- all, categories, brands, products
  product_ids uuid[] DEFAULT '{}',
  category_ids uuid[] DEFAULT '{}',
  brand_ids uuid[] DEFAULT '{}',
  
  -- Applies to customers
  applies_to_customers text NOT NULL DEFAULT 'all', -- all, groups, guests
  customer_group_ids uuid[] DEFAULT '{}',
  
  -- Discount
  discount_type text NOT NULL DEFAULT 'percentage', -- percentage, fixed, fixed_price
  discount_value numeric NOT NULL DEFAULT 0,
  badge_text text DEFAULT 'PROMO',
  
  -- Conditions
  min_quantity integer DEFAULT NULL,
  min_order_value numeric DEFAULT NULL,
  
  -- Validity
  starts_at timestamptz DEFAULT NULL,
  ends_at timestamptz DEFAULT NULL,
  
  -- Stacking
  allow_stacking boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing rules viewable by all" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage pricing rules" ON public.pricing_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
