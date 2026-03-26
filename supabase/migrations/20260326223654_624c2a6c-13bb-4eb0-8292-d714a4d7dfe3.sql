
-- Price List Items
CREATE TABLE public.price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text DEFAULT NULL,
  preferential_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (price_list_id, product_id)
);

ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price_list_items" ON public.price_list_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read price_list_items" ON public.price_list_items
  FOR SELECT TO authenticated
  USING (true);

-- Price List <-> Customer Groups junction
CREATE TABLE public.price_list_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  customer_group_id uuid NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (price_list_id, customer_group_id)
);

ALTER TABLE public.price_list_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price_list_groups" ON public.price_list_groups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read price_list_groups" ON public.price_list_groups
  FOR SELECT TO authenticated
  USING (true);

-- Price list settings in app_settings
INSERT INTO public.app_settings (key, value_json, description)
VALUES ('price_lists_enabled', 'false'::jsonb, 'Global toggle for Price Lists module')
ON CONFLICT DO NOTHING;
