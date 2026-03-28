DROP FUNCTION IF EXISTS public.search_products(text, integer);

CREATE OR REPLACE FUNCTION public.search_products(search_term text, result_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, name text, slug text, price numeric, image_url text, brand text, category_name text, rank real)
LANGUAGE sql STABLE
AS $$
  WITH fts AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      p.image_url,
      b.name AS brand,
      c.name AS category_name,
      ts_rank(p.search_vector, websearch_to_tsquery('simple', search_term)) AS fts_rank,
      similarity(p.name, search_term) AS trgm_score
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE
      p.search_vector @@ websearch_to_tsquery('simple', search_term)
      OR similarity(p.name, search_term) > 0.15
      OR p.name ILIKE '%' || search_term || '%'
      OR b.name ILIKE '%' || search_term || '%'
      OR p.sku ILIKE '%' || search_term || '%'
      OR c.name ILIKE '%' || search_term || '%'
  )
  SELECT
    fts.id,
    fts.name,
    fts.slug,
    fts.price,
    fts.image_url,
    fts.brand,
    fts.category_name,
    (fts.fts_rank * 2 + fts.trgm_score)::real AS rank
  FROM fts
  ORDER BY rank DESC
  LIMIT result_limit;
$$;