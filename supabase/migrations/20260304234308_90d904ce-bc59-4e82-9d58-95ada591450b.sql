
-- Add product_type column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'simple';

-- Create bundle items table
CREATE TABLE public.product_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bundle pricing settings stored in products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bundle_pricing_mode text DEFAULT 'fixed';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bundle_discount_percent numeric DEFAULT 0;

-- RLS
ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundle items viewable by all" ON public.product_bundle_items FOR SELECT USING (true);
CREATE POLICY "Admins manage bundle items" ON public.product_bundle_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
