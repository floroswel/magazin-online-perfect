-- Update is_public_app_setting_key to include all theme/storefront keys
CREATE OR REPLACE FUNCTION public.is_public_app_setting_key(_key text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT (
    _key LIKE 'editable_%'
    OR _key LIKE 'static_page_%'
    OR _key LIKE 'footer_%'
    OR _key LIKE 'show_%'
    OR _key = ANY (
      ARRAY[
        'store_branding','theme_settings','homepage_settings','gdpr_settings',
        'cookie_settings','seo_settings','currency_settings','checkout_settings',
        'cart_settings','menu_config','company_info','social_media','store_settings',
        'tracking_analytics','pixel_tracking','marketing_integrations','site_url',
        'homepage_sections','homepage_benefits','header_trust_bar','brand_story_content',
        'configurator_settings','personalization_scents','personalization_colors',
        'newsletter_settings','push_settings','affiliate_config','loyalty_config',
        'review_settings','social_feed_photos',
        'btn_bg_color','btn_text_color','btn_text_style',
        'cta_bg_color','cta_text_color','cta_text_style',
        'heading_size','bg_color','trust_icons',
        'primary_color','secondary_color','accent_color','background_color','text_color',
        'btn_primary_bg','btn_primary_text','btn_primary_hover','btn_border_radius',
        'cta_bg','cta_text','heading_font','body_font','font_size_scale',
        'header_bg','nav_bar_color','announcement_bg','announcement_text_color',
        'trust_strip_color','newsletter_bg','footer_upper_bg','footer_lower_bg',
        'custom_css','logo_url','logo_visible','site_name','site_tagline','favicon_url',
        'social_facebook','social_instagram','social_tiktok','social_youtube',
        'contact_phone','contact_email','contact_address','contact_schedule',
        'copyright_text','anpc_display','nav_links','trust_badges','ticker_text',
        'free_shipping_threshold','default_shipping_cost','ramburs_extra_cost',
        'low_stock_threshold','bestsellers_title','new_arrivals_title',
        'newsletter_title','newsletter_subtitle','delivery_time','return_days',
        'delivery_description','reviews_enabled','catalog_items_per_page',
        'catalog_default_sort','loyalty_enabled','company_iban','company_bank','company_name',
        'robots_txt'
      ]
    )
  );
$function$;

-- Seed default theme values
INSERT INTO app_settings (key, value_json) VALUES
('primary_color', '"#0066FF"'),
('secondary_color', '"#111111"'),
('accent_color', '"#FF3300"'),
('background_color', '"#FFFFFF"'),
('text_color', '"#111827"'),
('btn_primary_bg', '"#0066FF"'),
('btn_primary_text', '"#FFFFFF"'),
('btn_primary_hover', '"#0052CC"'),
('btn_border_radius', '"6"'),
('cta_bg', '"#FF3300"'),
('cta_text', '"#FFFFFF"'),
('heading_font', '"Inter"'),
('body_font', '"Inter"'),
('heading_size', '"standard"'),
('font_size_scale', '"1"'),
('announcement_bg', '"#FF3300"'),
('announcement_text_color', '"#FFFFFF"'),
('header_bg', '"#FFFFFF"'),
('nav_bar_color', '"#0066FF"'),
('trust_strip_color', '"#0066FF"'),
('newsletter_bg', '"#E8F0FF"'),
('footer_upper_bg', '"#1A2332"'),
('footer_lower_bg', '"#111111"'),
('custom_css', '""')
ON CONFLICT (key) DO NOTHING;