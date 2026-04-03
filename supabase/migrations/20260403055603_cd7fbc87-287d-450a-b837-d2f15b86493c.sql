CREATE TABLE public.sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sms_type TEXT NOT NULL DEFAULT 'general',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  twilio_sid TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view SMS logs"
  ON public.sms_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert SMS logs"
  ON public.sms_log FOR INSERT
  WITH CHECK (true);