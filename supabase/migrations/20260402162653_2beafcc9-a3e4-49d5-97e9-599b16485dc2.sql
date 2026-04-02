
CREATE TABLE public.external_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_key TEXT,
  enabled BOOLEAN DEFAULT true,
  include_payload BOOLEAN DEFAULT true,
  custom_headers JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMPTZ,
  last_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage external webhooks"
  ON public.external_webhooks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
