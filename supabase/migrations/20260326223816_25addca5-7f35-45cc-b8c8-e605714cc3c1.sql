
-- Product Lines table
CREATE TABLE public.product_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name text NOT NULL,
  description text DEFAULT NULL,
  grouping_attribute_id uuid REFERENCES public.product_attributes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product_lines" ON public.product_lines
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage product_lines" ON public.product_lines
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product Line Items (junction)
CREATE TABLE public.product_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id uuid NOT NULL REFERENCES public.product_lines(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

ALTER TABLE public.product_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product_line_items" ON public.product_line_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage product_line_items" ON public.product_line_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Module toggle
INSERT INTO public.app_settings (key, value_json, description)
VALUES ('product_lines_enabled', 'false'::jsonb, 'Global toggle for Product Lines module')
ON CONFLICT DO NOTHING;
