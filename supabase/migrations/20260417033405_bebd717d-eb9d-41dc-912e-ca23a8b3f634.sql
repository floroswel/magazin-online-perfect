
UPDATE public.app_settings SET value_json = to_jsonb('#E0118E'::text) WHERE key IN ('primary_color','accent_color','cta_bg','btn_primary_bg','product_price_color','badge_sale_color','savings_color');
UPDATE public.app_settings SET value_json = to_jsonb('#8A2BE2'::text) WHERE key IN ('secondary_color','nav_bar_color','trust_strip_color','badge_new_color','free_shipping_color');
UPDATE public.app_settings SET value_json = to_jsonb('#FAF8FB'::text) WHERE key IN ('background_color','header_bg');
UPDATE public.app_settings SET value_json = to_jsonb('#1F1828'::text) WHERE key IN ('text_color','footer_upper_bg','footer_lower_bg','footer_bg_color');
UPDATE public.app_settings SET value_json = to_jsonb('#FFFFFF'::text) WHERE key IN ('btn_primary_text','footer_text_color');
UPDATE public.app_settings SET value_json = to_jsonb('#E0118E'::text) WHERE key = 'announcement_bg';
UPDATE public.app_settings SET value_json = to_jsonb('Sora'::text) WHERE key = 'heading_font';
UPDATE public.app_settings SET value_json = to_jsonb('Manrope'::text) WHERE key = 'body_font';
