
-- Social proof simulated entries
CREATE TABLE public.social_proof_simulated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  product_image TEXT,
  time_display TEXT NOT NULL DEFAULT 'acum 5 minute',
  type TEXT NOT NULL DEFAULT 'purchase',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proof_simulated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage simulated entries" ON public.social_proof_simulated
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read active simulated" ON public.social_proof_simulated
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Custom messages
CREATE TABLE public.social_proof_custom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_text TEXT NOT NULL DEFAULT '',
  icon_type TEXT NOT NULL DEFAULT 'emoji',
  icon_value TEXT NOT NULL DEFAULT '🎁',
  link_url TEXT,
  valid_from DATE,
  valid_to DATE,
  priority INT NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proof_custom_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage custom messages" ON public.social_proof_custom_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read active custom messages" ON public.social_proof_custom_messages
  FOR SELECT TO anon, authenticated
  USING (active = true AND (valid_from IS NULL OR valid_from <= CURRENT_DATE) AND (valid_to IS NULL OR valid_to >= CURRENT_DATE));

-- Analytics
CREATE TABLE public.social_proof_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL DEFAULT 'purchase',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  was_clicked BOOLEAN NOT NULL DEFAULT false,
  was_dismissed BOOLEAN NOT NULL DEFAULT false,
  display_duration_ms INT,
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proof_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics" ON public.social_proof_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics" ON public.social_proof_analytics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
