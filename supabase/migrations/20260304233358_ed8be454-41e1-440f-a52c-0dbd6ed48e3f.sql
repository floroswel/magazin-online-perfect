
CREATE OR REPLACE FUNCTION public.get_dynamic_category_products(category_id uuid, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0)
 RETURNS TABLE(product_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      WHEN 'low_stock' THEN
        conditions := array_append(conditions, 'stock > 0 AND stock <= COALESCE(low_stock_threshold, 5)');
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
      WHEN 'created_recent' THEN
        conditions := array_append(conditions, format('created_at >= now() - interval ''%s days''', (rule->>'value')::integer));
      WHEN 'featured' THEN
        IF (rule->>'value')::boolean THEN
          conditions := array_append(conditions, 'featured = true');
        ELSE
          conditions := array_append(conditions, '(featured = false OR featured IS NULL)');
        END IF;
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
$function$;

-- Count function for preview
CREATE OR REPLACE FUNCTION public.count_dynamic_category_products(p_rules jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rule jsonb;
  conditions text[] := ARRAY[]::text[];
  cond text;
  result integer;
BEGIN
  IF p_rules IS NULL THEN RETURN 0; END IF;

  FOR rule IN SELECT * FROM jsonb_array_elements(p_rules)
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
      WHEN 'low_stock' THEN
        conditions := array_append(conditions, 'stock > 0 AND stock <= COALESCE(low_stock_threshold, 5)');
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
      WHEN 'created_recent' THEN
        conditions := array_append(conditions, format('created_at >= now() - interval ''%s days''', (rule->>'value')::integer));
      WHEN 'featured' THEN
        IF (rule->>'value')::boolean THEN
          conditions := array_append(conditions, 'featured = true');
        ELSE
          conditions := array_append(conditions, '(featured = false OR featured IS NULL)');
        END IF;
      ELSE
        NULL;
    END CASE;
  END LOOP;

  IF array_length(conditions, 1) IS NULL OR array_length(conditions, 1) = 0 THEN
    RETURN 0;
  END IF;

  cond := array_to_string(conditions, ' AND ');
  EXECUTE format('SELECT count(*)::integer FROM products WHERE %s', cond) INTO result;
  RETURN COALESCE(result, 0);
END;
$function$;
