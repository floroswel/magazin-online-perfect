
-- Create shipping_methods table
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🚚',
  price NUMERIC NOT NULL DEFAULT 0,
  free_above NUMERIC,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can read active shipping methods
CREATE POLICY "Anyone can read active shipping methods"
  ON public.shipping_methods FOR SELECT
  USING (is_active = true);

-- Admins can manage shipping methods
CREATE POLICY "Admins can manage shipping methods"
  ON public.shipping_methods FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default shipping methods
INSERT INTO public.shipping_methods (name, description, icon, price, free_above, estimated_days, is_active, sort_order) VALUES
  ('Standard', 'Livrare în 3-5 zile lucrătoare', '🚚', 25, 200, '3-5 zile', true, 1),
  ('Curier Express', 'Livrare în 1-2 zile lucrătoare', '⚡', 35, null, '1-2 zile', true, 2),
  ('Ridicare personală', 'Ridicare din magazin', '🏪', 0, null, 'Imediat', true, 3);

-- Add bg_color and badge_text columns to banners if missing
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#0066FF';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cta_link TEXT;

-- Insert all default app_settings for the 43 disconnected elements
INSERT INTO public.app_settings (key, value_json, description) VALUES
  ('free_shipping_threshold', '"200"', 'Prag transport gratuit (lei)'),
  ('default_shipping_cost', '"25"', 'Cost standard livrare (lei)'),
  ('ramburs_extra_cost', '"5"', 'Cost extra ramburs la curier'),
  ('company_iban', '"RO00XXXX0000000000000000"', 'IBAN companie'),
  ('company_bank', '"Banca Transilvania"', 'Banca companiei'),
  ('company_name', '"LUMAX SRL"', 'Numele companiei'),
  ('logo_url', '""', 'URL logo magazin'),
  ('logo_visible', '"true"', 'Afișare logo imagine'),
  ('site_name', '"LUMAX"', 'Numele magazinului'),
  ('site_tagline', '"magazin de încredere"', 'Slogan magazin'),
  ('social_facebook', '""', 'Link Facebook'),
  ('social_instagram', '""', 'Link Instagram'),
  ('social_tiktok', '""', 'Link TikTok'),
  ('social_youtube', '""', 'Link YouTube'),
  ('footer_col1_title', '"Informații"', 'Titlu coloana 1 footer'),
  ('footer_col1_links', '[]', 'Link-uri coloana 1 footer'),
  ('footer_col2_title', '"Ajutor"', 'Titlu coloana 2 footer'),
  ('footer_col2_links', '[]', 'Link-uri coloana 2 footer'),
  ('contact_phone', '"0800-123-456"', 'Telefon contact'),
  ('contact_email', '"contact@lumax.ro"', 'Email contact'),
  ('contact_address', '"București, România"', 'Adresă contact'),
  ('contact_schedule', '"Luni - Vineri, 9:00 - 17:00"', 'Program de lucru'),
  ('copyright_text', '""', 'Text copyright footer'),
  ('anpc_display', '"link"', 'Mod afișare ANPC: link / widget / ambele'),
  ('footer_upper_bg', '"#1A2332"', 'Culoare fundal footer superior'),
  ('footer_lower_bg', '"#111111"', 'Culoare fundal footer inferior'),
  ('nav_links', '[]', 'Link-uri navigare bara albastră'),
  ('trust_badges', '[]', 'Insigne trust strip (JSON)'),
  ('trust_strip_color', '""', 'Culoare fundal trust strip'),
  ('ticker_text', '"⚡ FLASH SALE: -50% la produse selectate!  ·  🚚 TRANSPORT GRATUIT comenzi > 200 lei!  ·  🎁 CADOU la comenzi > 300 lei!  ·  ⭐ CALITATE GARANTATĂ sau banii înapoi!"', 'Text ticker promo'),
  ('show_hero', '"true"', 'Vizibilitate secțiune Hero'),
  ('show_flash_deals', '"true"', 'Vizibilitate Flash Deals'),
  ('show_categories', '"true"', 'Vizibilitate categorii'),
  ('show_promo_banners', '"true"', 'Vizibilitate bannere promo'),
  ('show_featured', '"true"', 'Vizibilitate bestsellers'),
  ('show_trust', '"true"', 'Vizibilitate trust strip'),
  ('show_new_arrivals', '"true"', 'Vizibilitate noutăți'),
  ('show_recently_viewed', '"true"', 'Vizibilitate recent vizualizate'),
  ('show_newsletter', '"true"', 'Vizibilitate newsletter'),
  ('low_stock_threshold', '"5"', 'Prag stoc limitat'),
  ('nav_bar_color', '""', 'Culoare bara navigare'),
  ('header_bg', '""', 'Culoare fundal header'),
  ('bestsellers_title', '"⭐ Cele Mai Vândute"', 'Titlu secțiune bestsellers'),
  ('new_arrivals_title', '"🆕 Noutăți în Magazin"', 'Titlu secțiune noutăți'),
  ('newsletter_title', '"Abonează-te și primești 10% reducere"', 'Titlu newsletter'),
  ('newsletter_subtitle', '"Fii primul care află despre oferte exclusive și produse noi"', 'Subtitlu newsletter'),
  ('newsletter_bg', '""', 'Culoare fundal newsletter'),
  ('delivery_time', '"24-48h"', 'Timp estimat livrare'),
  ('return_days', '"30"', 'Zile politică retur'),
  ('delivery_description', '"Livrare prin curier în toată România"', 'Descriere livrare'),
  ('reviews_enabled', '"true"', 'Activare recenzii'),
  ('catalog_items_per_page', '"24"', 'Produse pe pagină catalog'),
  ('catalog_default_sort', '"relevance"', 'Sortare implicită catalog'),
  ('robots_txt', '""', 'Conținut robots.txt personalizat'),
  ('loyalty_enabled', '"true"', 'Activare puncte loialitate')
ON CONFLICT (key) DO NOTHING;
