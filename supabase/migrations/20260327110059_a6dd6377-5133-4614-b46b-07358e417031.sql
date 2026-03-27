
-- Site Visibility Settings
CREATE TABLE public.site_visibility_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_key text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  path_label text DEFAULT '',
  scheduled_from timestamptz,
  scheduled_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.site_visibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visibility" ON public.site_visibility_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage visibility" ON public.site_visibility_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visibility_settings;

-- Site Theme Settings
CREATE TABLE public.site_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  value_json jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.site_theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theme" ON public.site_theme_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage theme" ON public.site_theme_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_theme_settings;

-- Site Banners
CREATE TABLE public.site_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_type text NOT NULL DEFAULT 'announcement',
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  settings_json jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  scheduled_from timestamptz,
  scheduled_until timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read banners" ON public.site_banners FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage banners" ON public.site_banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_banners;

-- Site Layout Settings
CREATE TABLE public.site_layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  value_json jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.site_layout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read layout" ON public.site_layout_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage layout" ON public.site_layout_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_layout_settings;

-- Insert default theme settings
INSERT INTO public.site_theme_settings (setting_key, value_json) VALUES
  ('color_mode', '"auto"'),
  ('primary_color', '"210 40% 50%"'),
  ('secondary_color', '"210 20% 60%"'),
  ('background_color', '"0 0% 100%"'),
  ('text_color', '"210 40% 10%"'),
  ('font_family', '"Inter"'),
  ('font_size_scale', '"medium"'),
  ('heading_weight', '"bold"'),
  ('line_height', '"normal"'),
  ('button_shape', '"rounded"'),
  ('button_style', '"filled"'),
  ('button_hover', '"scale"'),
  ('border_radius', '8'),
  ('spacing_density', '"normal"');

-- Insert default layout settings
INSERT INTO public.site_layout_settings (setting_key, value_json) VALUES
  ('product_grid_columns', '4'),
  ('product_grid_mobile_columns', '2'),
  ('product_card_style', '"grid"'),
  ('product_sort_order', '"default"'),
  ('products_per_page', '12'),
  ('pagination_style', '"pages"'),
  ('header_logo_position', '"left"'),
  ('header_nav_position', '"center"'),
  ('header_sticky', 'true'),
  ('header_height', '"normal"'),
  ('header_transparent_hero', 'false'),
  ('header_cta_show', 'false'),
  ('header_cta_text', '""'),
  ('header_cta_url', '""'),
  ('footer_columns', '4'),
  ('footer_sol_anpc_position', '"inside"'),
  ('section_alignment', '"center"'),
  ('section_width', '"contained"');
