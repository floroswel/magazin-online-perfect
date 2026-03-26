
-- Customization Fields table
CREATE TABLE public.customization_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  internal_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  hint_text text DEFAULT NULL,
  location text NOT NULL DEFAULT 'product_page',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customization_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read customization_fields" ON public.customization_fields
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage customization_fields" ON public.customization_fields
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Junction: fields <-> products
CREATE TABLE public.customization_field_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.customization_fields(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, product_id)
);

ALTER TABLE public.customization_field_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read customization_field_products" ON public.customization_field_products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage customization_field_products" ON public.customization_field_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order customization values
CREATE TABLE public.order_customization_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid DEFAULT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  field_id uuid REFERENCES public.customization_fields(id) ON DELETE SET NULL,
  value_text text DEFAULT NULL,
  value_numeric numeric DEFAULT NULL,
  value_boolean boolean DEFAULT NULL,
  value_files jsonb DEFAULT NULL,
  value_list_option text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_customization_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order customizations" ON public.order_customization_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_customization_values.order_id AND orders.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage order_customization_values" ON public.order_customization_values
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own order customizations" ON public.order_customization_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_customization_values.order_id AND orders.user_id = auth.uid())
  );

-- Storage bucket for customization uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('customization-uploads', 'customization-uploads', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read customization uploads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'customization-uploads');

CREATE POLICY "Authenticated users can upload customization files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customization-uploads');

CREATE POLICY "Admins can delete customization files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'customization-uploads' AND public.has_role(auth.uid(), 'admin'));

-- Module toggle
INSERT INTO public.app_settings (key, value_json, description)
VALUES ('customization_fields_enabled', 'false'::jsonb, 'Global toggle for Order Customization module')
ON CONFLICT DO NOTHING;
