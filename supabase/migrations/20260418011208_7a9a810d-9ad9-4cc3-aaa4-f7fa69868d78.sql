-- Seed CMS keys with defaults (no overwrite)
INSERT INTO public.app_settings (key, value_json) VALUES
  ('homepage_promo_banner', '{"enabled": false, "text": "Reduceri de primăvară — până la -30%", "bg_color": "#B8935A", "text_color": "#FFFFFF", "link": ""}'::jsonb),
  ('homepage_why_us', '[{"icon":"🚚","title":"Livrare rapidă","text":"În 24-48h"},{"icon":"🔒","title":"Plată sigură","text":"SSL & 3D Secure"},{"icon":"↩️","title":"Retur 14 zile","text":"Fără costuri"},{"icon":"⭐","title":"Calitate premium","text":"100% verificată"}]'::jsonb),
  ('homepage_brands', '[]'::jsonb),
  ('shipping_page_content', '{"title":"Livrare","intro_html":"<p>Comanda ta e procesată în maxim 24h.</p>","free_shipping_threshold":200,"delivery_time":"1-3 zile lucrătoare","carriers":"Sameday, FAN Courier, Cargus"}'::jsonb),
  ('tracking_page_content', '{"title":"Urmărire comandă","intro":"Introdu codul AWB pentru a vedea statusul.","embed_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Allow public (anon) read access to these keys via existing helper
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
    OR _key LIKE 'header_%'
    OR _key LIKE 'show_%'
    OR _key LIKE 'ticker%'
    OR _key LIKE 'site_alert%'
    OR _key LIKE 'contact_%'
    OR _key LIKE 'chatbot_%'
    OR _key LIKE 'pwa_%'
    OR _key LIKE 'gdpr_%'
    OR _key LIKE 'checkout_%'
    OR _key LIKE 'homepage_%'
    OR _key LIKE 'shipping_page%'
    OR _key LIKE 'tracking_page%'
    OR _key = ANY (
      ARRAY[
        'store_branding','theme_settings','homepage_settings','gdpr_settings',
        'cookie_settings','seo_settings','currency_settings','checkout_settings',
        'cart_settings','menu_config','social_media','store_settings',
        'site_url',
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
        'nav_bar_color','announcement_bg','announcement_text_color',
        'trust_strip_color','newsletter_bg','newsletter_trust_text',
        'custom_css','logo_url','logo_visible','site_name','site_tagline','favicon_url',
        'social_facebook','social_instagram','social_tiktok','social_youtube','social_pinterest',
        'contact_phone','contact_email','contact_address','contact_schedule',
        'copyright_text','anpc_display','nav_links','trust_badges','ticker_text',
        'free_shipping_threshold','default_shipping_cost','ramburs_extra_cost',
        'low_stock_threshold','bestsellers_title','new_arrivals_title',
        'newsletter_title','newsletter_subtitle','delivery_time','return_days',
        'delivery_description','reviews_enabled','catalog_items_per_page',
        'catalog_default_sort','loyalty_enabled','company_iban','company_bank','company_name',
        'robots_txt',
        'product_price_color','product_stars_color','badge_sale_color',
        'badge_new_color','free_shipping_color','savings_color'
      ]
    )
  );
$function$;