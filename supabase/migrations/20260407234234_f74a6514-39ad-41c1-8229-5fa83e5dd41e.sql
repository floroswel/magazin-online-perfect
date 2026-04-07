
CREATE TABLE public.legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_version TEXT DEFAULT '1.0',
  accepted BOOLEAN NOT NULL DEFAULT true,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_consents_order ON public.legal_consents(order_id);
CREATE INDEX idx_legal_consents_user ON public.legal_consents(user_id);
CREATE INDEX idx_legal_consents_email ON public.legal_consents(email);

ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own consent
CREATE POLICY "Insert own consent" ON public.legal_consents
  FOR INSERT WITH CHECK (
    email IS NOT NULL AND length(email) >= 5
    AND consent_type IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Users can see their own consents
CREATE POLICY "Users read own consents" ON public.legal_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins read all consents" ON public.legal_consents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.legal_consents IS 'Tracks acceptance of Terms & Conditions, Privacy Policy, and newsletter consent at checkout';
