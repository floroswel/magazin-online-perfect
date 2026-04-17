
-- Drop the generated search_vector column that depends on brand
ALTER TABLE public.products DROP COLUMN search_vector;

-- Recreate search_vector without brand (brand is now in brands table via FK)
ALTER TABLE public.products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple'::regconfig, COALESCE(name, ''::text)), 'A'::"char") ||
    setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'C'::"char")
  ) STORED;

-- Now drop the old brand text column
ALTER TABLE public.products DROP COLUMN brand;

-- Re-create the GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING gin(search_vector);
