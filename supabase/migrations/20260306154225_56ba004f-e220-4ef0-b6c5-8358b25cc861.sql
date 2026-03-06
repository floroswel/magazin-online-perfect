
-- Event Bus table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  payload jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_events_type_v2 ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_unprocessed ON public.events(processed) WHERE processed = false;
