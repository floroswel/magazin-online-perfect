CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);

CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_products(search_term text, result_limit int DEFAULT 6)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  image_url text,
  brand text,
  category_name text,
  rank real
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH fts AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      p.image_url,
      p.brand,
      c.name AS category_name,
      ts_rank(p.search_vector, websearch_to_tsquery('simple', search_term)) AS fts_rank,
      similarity(p.name, search_term) AS trgm_score
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE
      p.search_vector @@ websearch_to_tsquery('simple', search_term)
      OR similarity(p.name, search_term) > 0.15
      OR p.name ILIKE '%' || search_term || '%'
      OR p.brand ILIKE '%' || search_term || '%'
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