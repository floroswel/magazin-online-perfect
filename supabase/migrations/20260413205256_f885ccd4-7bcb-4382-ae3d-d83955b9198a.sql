
-- ═══ FAQ Items ═══
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on faq_items" ON public.faq_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active faqs" ON public.faq_items
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ═══ Site Popups ═══
CREATE TABLE IF NOT EXISTS public.site_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  popup_type TEXT NOT NULL DEFAULT 'welcome',
  title TEXT,
  body_html TEXT,
  cta_text TEXT,
  cta_link TEXT,
  image_url TEXT,
  coupon_code TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'delay',
  trigger_value INTEGER DEFAULT 3,
  display_frequency TEXT NOT NULL DEFAULT 'once_per_session',
  is_active BOOLEAN NOT NULL DEFAULT false,
  pages TEXT[] DEFAULT ARRAY['all']::TEXT[],
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on site_popups" ON public.site_popups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active popups" ON public.site_popups
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ═══ Add RLS to existing seo_redirects if missing ═══
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seo_redirects' AND policyname = 'Admins full access on seo_redirects') THEN
    EXECUTE 'CREATE POLICY "Admins full access on seo_redirects" ON public.seo_redirects FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seo_redirects' AND policyname = 'Public read seo_redirects') THEN
    EXECUTE 'CREATE POLICY "Public read seo_redirects" ON public.seo_redirects FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;
END $$;
