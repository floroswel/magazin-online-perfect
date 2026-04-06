
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  hero_image TEXT DEFAULT '',
  published BOOLEAN DEFAULT false,
  visits INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published landing pages"
  ON public.landing_pages FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage landing pages"
  ON public.landing_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
