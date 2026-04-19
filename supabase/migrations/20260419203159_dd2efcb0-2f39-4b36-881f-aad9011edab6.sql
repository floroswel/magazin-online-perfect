
-- ============== ANALYTICS ==============
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  url text NOT NULL,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read page_views" ON public.page_views FOR SELECT USING (public.is_admin());
CREATE POLICY "Anyone can insert page_views" ON public.page_views FOR INSERT WITH CHECK (true);

CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  ip_address text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  page_count integer NOT NULL DEFAULT 1
);
CREATE INDEX idx_user_sessions_started ON public.user_sessions(started_at DESC);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read user_sessions" ON public.user_sessions FOR SELECT USING (public.is_admin());
CREATE POLICY "Anyone can manage own session" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

-- ============== SECURITY ==============
CREATE TABLE public.ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ip_whitelist" ON public.ip_whitelist FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  secret_encrypted text,
  backup_codes_encrypted text,
  enabled_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own 2FA" ON public.two_factor_auth FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read 2FA" ON public.two_factor_auth FOR SELECT USING (public.is_admin());

CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sessions" ON public.admin_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users see own sessions" ON public.admin_sessions FOR SELECT USING (auth.uid() = user_id);

-- ============== DOMAINS ==============
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  ssl_status text NOT NULL DEFAULT 'pending',
  verification_token text,
  dns_records jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage domains" ON public.domains FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== APP STORE ==============
CREATE TABLE public.app_store_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  icon_url text,
  developer text,
  version text DEFAULT '1.0.0',
  pricing_model text NOT NULL DEFAULT 'free',
  price numeric DEFAULT 0,
  config_schema jsonb DEFAULT '{}'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_store_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse apps" ON public.app_store_apps FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage apps" ON public.app_store_apps FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.app_store_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.app_store_apps(id) ON DELETE CASCADE,
  installed_by uuid,
  config jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  installed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id)
);
ALTER TABLE public.app_store_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage installations" ON public.app_store_installations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== THEME EDITOR ==============
CREATE TABLE public.theme_editor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  value_json jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.theme_editor_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads theme" ON public.theme_editor_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage theme" ON public.theme_editor_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== A/B TESTING ==============
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  test_type text NOT NULL DEFAULT 'page',
  target_url text,
  status text NOT NULL DEFAULT 'draft',
  traffic_split integer NOT NULL DEFAULT 50,
  start_date timestamptz,
  end_date timestamptz,
  winner_variant_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ab_tests" ON public.ab_tests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_control boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  visitors integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage variants" ON public.ab_test_variants FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== CUSTOMER SEGMENTATION ==============
CREATE TABLE public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_count integer NOT NULL DEFAULT 0,
  is_dynamic boolean NOT NULL DEFAULT true,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage segments" ON public.customer_segments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#6B7280',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tags" ON public.customer_tags FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.customer_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);
ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tag assignments" ON public.customer_tag_assignments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== RECOMMENDATIONS & RETARGETING ==============
CREATE TABLE public.product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL DEFAULT 'related',
  weight integer NOT NULL DEFAULT 1,
  is_manual boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_product_id, recommended_product_id, recommendation_type)
);
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads recommendations" ON public.product_recommendations FOR SELECT USING (true);
CREATE POLICY "Admins manage recommendations" ON public.product_recommendations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.retargeting_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  trigger_event text NOT NULL,
  audience_segment_id uuid REFERENCES public.customer_segments(id),
  delay_hours integer NOT NULL DEFAULT 24,
  message_template text,
  is_active boolean NOT NULL DEFAULT false,
  sent_count integer NOT NULL DEFAULT 0,
  conversion_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retargeting_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage retargeting" ON public.retargeting_campaigns FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== POPUPS ==============
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  popup_type text NOT NULL DEFAULT 'newsletter',
  trigger_type text NOT NULL DEFAULT 'time',
  trigger_value text,
  title text,
  subtitle text,
  body_html text,
  cta_text text,
  cta_url text,
  image_url text,
  background_color text DEFAULT '#FFFFFF',
  text_color text DEFAULT '#111111',
  display_pages jsonb DEFAULT '["all"]'::jsonb,
  display_devices jsonb DEFAULT '["desktop","mobile"]'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  conversion_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active popups" ON public.popups FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage popups" ON public.popups FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== SOCIAL PROOF ==============
CREATE TABLE public.social_proof_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  display_position text NOT NULL DEFAULT 'bottom-left',
  rotation_seconds integer NOT NULL DEFAULT 8,
  max_messages integer NOT NULL DEFAULT 10,
  show_recent_purchases boolean NOT NULL DEFAULT true,
  show_active_visitors boolean NOT NULL DEFAULT true,
  show_low_stock boolean NOT NULL DEFAULT true,
  hide_after_seconds integer DEFAULT 6,
  pages jsonb DEFAULT '["home","product","catalog"]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_proof_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads social proof" ON public.social_proof_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage social proof" ON public.social_proof_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== STOCK TRACEABILITY ==============
CREATE TABLE public.product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  manufactured_at date,
  expires_at date,
  supplier_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_batches_product ON public.product_batches(product_id);
CREATE INDEX idx_product_batches_expires ON public.product_batches(expires_at);
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage batches" ON public.product_batches FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.product_serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number text NOT NULL UNIQUE,
  imei text,
  status text NOT NULL DEFAULT 'in_stock',
  order_id uuid,
  batch_id uuid REFERENCES public.product_batches(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_serials_status ON public.product_serials(status);
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage serials" ON public.product_serials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL,
  quantity_change integer NOT NULL,
  reason text NOT NULL,
  notes text,
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_adjustments_product ON public.stock_adjustments(product_id);
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock adjustments" ON public.stock_adjustments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== EXIT INTENT POPUPS ==============
CREATE TABLE public.exit_intent_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  subtitle text,
  cta_text text DEFAULT 'Revendică',
  discount_code_template text DEFAULT 'STAY10',
  discount_percent integer DEFAULT 10,
  valid_hours integer DEFAULT 24,
  is_active boolean NOT NULL DEFAULT false,
  display_devices jsonb DEFAULT '["desktop"]'::jsonb,
  view_count integer NOT NULL DEFAULT 0,
  claim_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exit_intent_popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active exit popups" ON public.exit_intent_popups FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage exit popups" ON public.exit_intent_popups FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Triggers updated_at
CREATE TRIGGER trg_ab_tests_updated BEFORE UPDATE ON public.ab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customer_segments_updated BEFORE UPDATE ON public.customer_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_retargeting_updated BEFORE UPDATE ON public.retargeting_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_popups_updated BEFORE UPDATE ON public.popups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exit_popups_updated BEFORE UPDATE ON public.exit_intent_popups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
