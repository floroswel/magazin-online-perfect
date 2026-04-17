
-- SEO redirects table
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  target_url text NOT NULL,
  redirect_type integer DEFAULT 301,
  hit_count integer DEFAULT 0,
  last_hit_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage seo_redirects" ON public.seo_redirects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_redirects_source ON public.seo_redirects(source_url);
