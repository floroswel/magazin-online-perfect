
-- Add product badge columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badge_new boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_new_until timestamptz,
  ADD COLUMN IF NOT EXISTS badge_bestseller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_promo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_exclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_low_stock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_custom_text text,
  ADD COLUMN IF NOT EXISTS badge_custom_color text;

-- Seed missing visibility settings
INSERT INTO public.site_visibility_settings (element_key, is_active)
VALUES
  ('announcement_bar', true),
  ('hero_section', true),
  ('social_proof_bar', true),
  ('collections_grid', true),
  ('bestsellers_section', true),
  ('brand_story_section', true),
  ('scent_guide_teaser', true),
  ('reviews_section', true),
  ('newsletter_section', true),
  ('header_wishlist', true),
  ('product_badges', true),
  ('product_reviews_section', true),
  ('product_share_btn', true),
  ('quiz_cta_banner', true),
  ('gift_experience_checkout', true),
  ('burn_log_tab', true),
  ('loyalty_points_display', true),
  ('blog_section', true),
  ('comparison_feature', true),
  ('sol_link', true),
  ('anpc_link', true),
  ('gdpr_banner', true),
  ('social_icons_footer', true),
  ('tracking_page', true),
  ('affiliate_page', true),
  ('bulk_orders_page', true)
ON CONFLICT (element_key) DO NOTHING;
