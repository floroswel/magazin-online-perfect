
-- Dynamic (smart) categories table
CREATE TABLE public.dynamic_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dynamic_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view visible dynamic categories
CREATE POLICY "Dynamic categories viewable by all"
ON public.dynamic_categories
FOR SELECT
USING (visible = true);

-- Admins manage all
CREATE POLICY "Admins manage dynamic categories"
ON public.dynamic_categories
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to get product IDs matching a dynamic category's rules
CREATE OR REPLACE FUNCTION public.get_dynamic_category_products(category_id uuid, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0)
RETURNS TABLE(product_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cat_rules jsonb;
  rule jsonb;
  base_query text;
  conditions text[] := ARRAY[]::text[];
  cond text;
BEGIN
  SELECT rules INTO cat_rules FROM dynamic_categories WHERE id = category_id;
  IF cat_rules IS NULL THEN RETURN; END IF;

  FOR rule IN SELECT * FROM jsonb_array_elements(cat_rules)
  LOOP
    CASE rule->>'type'
      WHEN 'price_range' THEN
        conditions := array_append(conditions, format('price BETWEEN %s AND %s',
          (rule->>'min')::numeric, (rule->>'max')::numeric));
      WHEN 'brand' THEN
        conditions := array_append(conditions, format('brand = %L', rule->>'value'));
      WHEN 'tag' THEN
        conditions := array_append(conditions, format('%L = ANY(tags)', rule->>'value'));
      WHEN 'in_stock' THEN
        IF (rule->>'value')::boolean THEN
          conditions := array_append(conditions, 'stock > 0');
        ELSE
          conditions := array_append(conditions, 'stock = 0');
        END IF;
      WHEN 'has_discount' THEN
        IF (rule->>'value')::boolean THEN
          conditions := array_append(conditions, 'old_price IS NOT NULL AND old_price > price');
        ELSE
          conditions := array_append(conditions, '(old_price IS NULL OR old_price <= price)');
        END IF;
      WHEN 'category' THEN
        conditions := array_append(conditions, format('category_id = %L', rule->>'value'));
      WHEN 'min_rating' THEN
        conditions := array_append(conditions, format('rating >= %s', (rule->>'value')::numeric));
      ELSE
        -- skip unknown rule types
    END CASE;
  END LOOP;

  IF array_length(conditions, 1) IS NULL OR array_length(conditions, 1) = 0 THEN
    RETURN;
  END IF;

  cond := array_to_string(conditions, ' AND ');
  base_query := format('SELECT id AS product_id FROM products WHERE %s ORDER BY created_at DESC LIMIT %s OFFSET %s', cond, result_limit, result_offset);

  RETURN QUERY EXECUTE base_query;
END;
$$;
