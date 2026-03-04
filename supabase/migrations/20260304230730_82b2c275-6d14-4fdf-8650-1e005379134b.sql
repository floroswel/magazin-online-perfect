
-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ean text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alts jsonb DEFAULT '{}';

-- Product relations table (related/cross-sell/upsell)
CREATE TABLE IF NOT EXISTS product_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'related',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product relations viewable by all" ON product_relations FOR SELECT USING (true);
CREATE POLICY "Admins manage product relations" ON product_relations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Product categories junction table for multi-category support
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product categories viewable by all" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage product categories" ON product_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
