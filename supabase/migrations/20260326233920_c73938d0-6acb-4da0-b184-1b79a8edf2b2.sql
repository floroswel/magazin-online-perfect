
-- Custom 404 settings (singleton)
CREATE TABLE public.custom_404_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  image_url text,
  image_alignment text NOT NULL DEFAULT 'center',
  image_max_width text NOT NULL DEFAULT '400px',
  title_text text NOT NULL DEFAULT 'Oops! Pagina nu a fost găsită',
  title_font_size int NOT NULL DEFAULT 32,
  title_color text NOT NULL DEFAULT '#1a1a1a',
  title_bold boolean NOT NULL DEFAULT true,
  subtitle_text text NOT NULL DEFAULT 'Ne pare rău, pagina pe care o cauți nu există sau a fost mutată. Dar nu îngrijora — mai ai multe de explorat în magazinul nostru!',
  subtitle_font_size int NOT NULL DEFAULT 16,
  subtitle_color text NOT NULL DEFAULT '#666666',
  buttons jsonb NOT NULL DEFAULT '[{"label":"Înapoi acasă","url":"/","style":"default","color":""},{"label":"Vezi toate produsele","url":"/catalog","style":"outline","color":""}]'::jsonb,
  show_recommended_products boolean NOT NULL DEFAULT false,
  recommended_section_title text NOT NULL DEFAULT 'S-ar putea să-ți placă',
  recommended_count int NOT NULL DEFAULT 4,
  recommended_source text NOT NULL DEFAULT 'featured',
  recommended_product_ids jsonb,
  recommended_show_price boolean NOT NULL DEFAULT true,
  recommended_show_add_to_cart boolean NOT NULL DEFAULT true,
  show_search boolean NOT NULL DEFAULT true,
  search_placeholder text NOT NULL DEFAULT 'Caută produse în magazin...',
  show_categories boolean NOT NULL DEFAULT false,
  categories_title text NOT NULL DEFAULT 'Explorează categoriile noastre',
  category_ids jsonb,
  background_color text,
  background_image_url text,
  meta_title text NOT NULL DEFAULT 'Pagina nu a fost găsită',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_404_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read 404 settings" ON public.custom_404_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage 404 settings" ON public.custom_404_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.custom_404_settings (id) VALUES (gen_random_uuid());

-- 404 access log
CREATE TABLE public.custom_404_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_accessed text NOT NULL,
  referrer text,
  user_agent text,
  ip_hash text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.truncate_404_url() RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  NEW.url_accessed := left(NEW.url_accessed, 500);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_truncate_404_url BEFORE INSERT ON public.custom_404_log FOR EACH ROW EXECUTE FUNCTION public.truncate_404_url();

ALTER TABLE public.custom_404_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert 404 log" ON public.custom_404_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read 404 log" ON public.custom_404_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Aggregated stats view
CREATE OR REPLACE VIEW public.custom_404_stats AS
SELECT
  url_accessed,
  count(*)::int AS visit_count,
  min(accessed_at) AS first_seen,
  max(accessed_at) AS last_seen,
  count(DISTINCT referrer)::int AS referrer_count
FROM public.custom_404_log
GROUP BY url_accessed
ORDER BY count(*) DESC;
