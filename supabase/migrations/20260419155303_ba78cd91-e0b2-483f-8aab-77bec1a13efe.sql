ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_g integer,
  ADD COLUMN IF NOT EXISTS container_type text;

CREATE INDEX IF NOT EXISTS idx_products_weight_g ON public.products(weight_g) WHERE weight_g IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_container_type ON public.products(container_type) WHERE container_type IS NOT NULL;