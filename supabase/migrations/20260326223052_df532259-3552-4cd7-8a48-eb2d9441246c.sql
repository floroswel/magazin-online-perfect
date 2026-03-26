
-- Bundle settings (global defaults)
CREATE TABLE public.bundle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  default_availability_rule text NOT NULL DEFAULT 'all_available',
  default_order_display_mode text NOT NULL DEFAULT 'bundle_zero',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bundle_settings" ON public.bundle_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.bundle_settings (enabled, default_availability_rule, default_order_display_mode)
VALUES (false, 'all_available', 'bundle_zero');

-- Bundle products
CREATE TABLE public.bundle_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT NULL,
  short_description text DEFAULT NULL,
  price_type text NOT NULL DEFAULT 'fixed',
  price_value numeric NOT NULL DEFAULT 0,
  original_total_value numeric DEFAULT 0,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  availability_rule text NOT NULL DEFAULT 'all_available',
  order_display_mode text NOT NULL DEFAULT 'bundle_zero',
  images jsonb DEFAULT '[]'::jsonb,
  image_url text DEFAULT NULL,
  meta_title text DEFAULT NULL,
  meta_description text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active bundles" ON public.bundle_products
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage bundle_products" ON public.bundle_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bundle components
CREATE TABLE public.bundle_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundle_products(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read bundle components" ON public.bundle_components
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage bundle_components" ON public.bundle_components
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
