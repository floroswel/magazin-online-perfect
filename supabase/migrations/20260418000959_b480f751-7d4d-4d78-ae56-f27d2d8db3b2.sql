-- 1. ENUMs pentru vizibilitate și disponibilitate produs
DO $$ BEGIN
  CREATE TYPE public.visibility_state AS ENUM ('visible', 'hidden_catalog', 'hidden_total');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.availability_state AS ENUM (
    'in_stock','low_stock','out_of_stock','preorder',
    'available_2_3','available_5_7','available_7_10',
    'available_10_20','discontinued','notify_me'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extindem products (non-destructiv)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS visibility       public.visibility_state    DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS availability     public.availability_state  DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS warranty_text    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2);

-- Index pentru filtrare rapidă în catalog
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products(visibility) WHERE visibility = 'visible';

-- 3. Tabel product_comparisons (sesiune anonimă sau user)
CREATE TABLE IF NOT EXISTS public.product_comparisons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  user_id     UUID,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_comparisons_session ON public.product_comparisons(session_id);
CREATE INDEX IF NOT EXISTS idx_product_comparisons_user ON public.product_comparisons(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;

-- Oricine (vizitator inclus) poate gestiona propria listă (validată client-side prin session_id)
DROP POLICY IF EXISTS "Anyone can read comparisons" ON public.product_comparisons;
CREATE POLICY "Anyone can read comparisons"
  ON public.product_comparisons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can add comparisons" ON public.product_comparisons;
CREATE POLICY "Anyone can add comparisons"
  ON public.product_comparisons FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete comparisons" ON public.product_comparisons;
CREATE POLICY "Anyone can delete comparisons"
  ON public.product_comparisons FOR DELETE
  USING (true);

-- 4. Seed cheile lipsă în app_settings (folosind structura existentă value_json)
INSERT INTO public.app_settings (key, value_json, description) VALUES
  ('footer_company_name',  '"Lumânări Artizanale"'::jsonb, 'Numele companiei în footer'),
  ('footer_tagline',       '"Lumina care te inspiră"'::jsonb, 'Tagline footer'),
  ('footer_email',         '"contact@lumanari.ro"'::jsonb, 'Email contact footer'),
  ('footer_phone',         '"+40 700 000 000"'::jsonb, 'Telefon footer'),
  ('footer_address',       '"București, România"'::jsonb, 'Adresă footer'),
  ('footer_show_social',   'true'::jsonb, 'Afișează iconițe social media'),
  ('footer_facebook',      '""'::jsonb, 'URL Facebook'),
  ('footer_instagram',     '""'::jsonb, 'URL Instagram'),
  ('footer_copyright',     '"© 2025 Lumânări Artizanale. Toate drepturile rezervate."'::jsonb, 'Text copyright'),
  ('footer_col1_title',    '"Colecții"'::jsonb, 'Titlu coloană 1 footer'),
  ('footer_col1_links',    '[{"label":"Soia Naturală","url":"/colectii/soia"},{"label":"Ceară de Albine","url":"/colectii/albine"},{"label":"Cadouri","url":"/cadouri"}]'::jsonb, 'Linkuri coloană 1'),
  ('footer_col2_title',    '"Informații"'::jsonb, 'Titlu coloană 2 footer'),
  ('footer_col2_links',    '[{"label":"Despre noi","url":"/despre"},{"label":"Blog","url":"/blog"},{"label":"Contact","url":"/contact"}]'::jsonb, 'Linkuri coloană 2'),
  ('editable_breadcrumbs', '{"home_label":"Acasă","separator":"/","show_icons":false,"custom_overrides":{}}'::jsonb, 'Configurare breadcrumbs'),
  ('domain_settings',      '{"primary_domain":"","www_redirect":true,"force_https":true,"custom_404":"/404"}'::jsonb, 'Setări domeniu')
ON CONFLICT (key) DO NOTHING;