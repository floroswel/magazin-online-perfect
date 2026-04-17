
CREATE TABLE public.product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  weight_grams integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product sizes"
  ON public.product_sizes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage product sizes"
  ON public.product_sizes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_product_sizes_product_id ON public.product_sizes(product_id);
