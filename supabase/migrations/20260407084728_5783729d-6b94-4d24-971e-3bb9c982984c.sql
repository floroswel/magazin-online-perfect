
-- 1. Fix product-videos storage: restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product videos" ON storage.objects;

CREATE POLICY "Admins can upload product videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-videos'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update product videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-videos'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete product videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-videos'
    AND public.has_role(auth.uid(), 'admin')
  );

-- 2. Fix social_proof_events: restrict SELECT to admin only (use simulated for public)
DROP POLICY IF EXISTS "Anyone can read social proof events" ON public.social_proof_events;
DROP POLICY IF EXISTS "Public can read social proof" ON public.social_proof_events;
DO $$ BEGIN
  -- Try dropping any SELECT policy on this table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.social_proof_events;', ' ')
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_proof_events' AND cmd = 'SELECT'
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Only admins can read social proof events" ON public.social_proof_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Fix blog_posts: only show published posts to public
DROP POLICY IF EXISTS "Posts viewable by all" ON public.blog_posts;
CREATE POLICY "Posts viewable by all" ON public.blog_posts
  FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

-- 4. Fix chatbot_sessions: restrict customer_id impersonation
DROP POLICY IF EXISTS "Anon insert sessions" ON public.chatbot_sessions;
CREATE POLICY "Anon insert sessions" ON public.chatbot_sessions
  FOR INSERT TO anon
  WITH CHECK (customer_id IS NULL);

CREATE POLICY "Auth insert own sessions" ON public.chatbot_sessions
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);

-- 5. Fix chatbot_messages: require session ownership
DROP POLICY IF EXISTS "Insert messages" ON public.chatbot_messages;
CREATE POLICY "Insert messages" ON public.chatbot_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatbot_sessions s
      WHERE s.id = session_id
        AND (s.customer_id IS NULL OR s.customer_id = auth.uid())
    )
  );

-- 6. Fix chatbot_conversations: anonymous users shouldn't see all null-user conversations
DROP POLICY IF EXISTS "Anon can read own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.chatbot_conversations;
DO $$ BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.chatbot_conversations;', ' ')
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chatbot_conversations' AND cmd = 'SELECT'
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Auth users read own conversations" ON public.chatbot_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 7. Fix stock_change_log: admin only insert
DROP POLICY IF EXISTS "Authenticated users can insert stock log" ON public.stock_change_log;
CREATE POLICY "Admins can insert stock log" ON public.stock_change_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Fix smartbill_sync_log: admin only insert
DROP POLICY IF EXISTS "Authenticated users can insert smartbill_sync_log" ON public.smartbill_sync_log;
CREATE POLICY "Admins can insert smartbill_sync_log" ON public.smartbill_sync_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Fix chatbot_actions_log: admin only insert
DROP POLICY IF EXISTS "Insert actions_log" ON public.chatbot_actions_log;
CREATE POLICY "Insert actions_log" ON public.chatbot_actions_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatbot_sessions s
      WHERE s.id = session_id
        AND (s.customer_id IS NULL OR s.customer_id = auth.uid())
    )
  );

-- 10. Fix product_reviews: only show approved reviews publicly
DROP POLICY IF EXISTS "Reviews viewable by all" ON public.product_reviews;
CREATE POLICY "Reviews viewable by all" ON public.product_reviews
  FOR SELECT USING (
    status = 'approved'
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 11. Remove company_info from public allowlist
CREATE OR REPLACE FUNCTION public.is_public_app_setting_key(_key text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $$
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
        'trust_strip_color','newsletter_bg',
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
$$;
