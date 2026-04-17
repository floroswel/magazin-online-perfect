CREATE OR REPLACE FUNCTION public.is_public_app_setting_key(_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (
    _key LIKE 'editable_%'
    OR _key LIKE 'static_page_%'
    OR _key LIKE 'footer_%'
    OR _key = ANY (
      ARRAY[
        'store_branding',
        'theme_settings',
        'homepage_settings',
        'gdpr_settings',
        'cookie_settings',
        'seo_settings',
        'currency_settings',
        'checkout_settings',
        'cart_settings',
        'menu_config',
        'company_info',
        'social_media',
        'store_settings',
        'tracking_analytics',
        'pixel_tracking',
        'marketing_integrations',
        'site_url',
        'homepage_sections',
        'homepage_benefits',
        'header_trust_bar',
        'brand_story_content',
        'configurator_settings',
        'personalization_scents',
        'personalization_colors',
        'newsletter_settings',
        'push_settings',
        'affiliate_config',
        'loyalty_config',
        'review_settings',
        'social_feed_photos',
        'btn_bg_color',
        'btn_text_color',
        'btn_text_style',
        'cta_bg_color',
        'cta_text_color',
        'cta_text_style',
        'heading_size',
        'bg_color',
        'trust_icons'
      ]
    )
  );
$$;

DROP POLICY IF EXISTS "Anon can view public settings" ON public.app_settings;
CREATE POLICY "Anon can view public settings"
ON public.app_settings
FOR SELECT
TO anon
USING (public.is_public_app_setting_key(key));

DROP POLICY IF EXISTS "Auth can view settings" ON public.app_settings;
CREATE POLICY "Authenticated users can view public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  public.is_public_app_setting_key(key)
  OR public.has_role(auth.uid(), 'admin')
);