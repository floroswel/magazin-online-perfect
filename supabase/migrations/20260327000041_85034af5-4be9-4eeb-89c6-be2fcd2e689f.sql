
-- Chatbot settings (singleton)
CREATE TABLE public.chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  assistant_name TEXT NOT NULL DEFAULT 'Asistent',
  avatar_url TEXT,
  widget_color TEXT NOT NULL DEFAULT '#6366f1',
  welcome_message TEXT NOT NULL DEFAULT 'Bună! Sunt asistentul virtual al magazinului. Cum te pot ajuta astăzi?',
  offline_message TEXT NOT NULL DEFAULT 'Momentan suntem offline. Lasă-ne un mesaj și te contactăm în cel mai scurt timp!',
  schedule_type TEXT NOT NULL DEFAULT '24h',
  schedule_hours JSONB NOT NULL DEFAULT '{}',
  features_enabled JSONB NOT NULL DEFAULT '{"order_tracking":true,"order_cancel":true,"return_init":true,"invoice_download":true,"address_update":false,"product_recommendations":true,"faq":true}',
  auto_escalate_after_messages INT NOT NULL DEFAULT 3,
  escalate_on_negative_sentiment BOOLEAN NOT NULL DEFAULT false,
  escalate_keywords TEXT NOT NULL DEFAULT 'reclamație, plângere, avocat, ANPC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read chatbot_settings" ON public.chatbot_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update chatbot_settings" ON public.chatbot_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert chatbot_settings" ON public.chatbot_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chatbot sessions
CREATE TABLE public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  customer_email TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  escalated_to_ticket_id UUID,
  satisfaction_rating INT,
  messages_count INT NOT NULL DEFAULT 0,
  orders_actioned JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read chatbot_sessions" ON public.chatbot_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own sessions read" ON public.chatbot_sessions FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Anon insert sessions" ON public.chatbot_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Update own sessions" ON public.chatbot_sessions FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon update sessions" ON public.chatbot_sessions FOR UPDATE TO anon USING (true);

-- Chatbot messages
CREATE TABLE public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read chatbot_messages" ON public.chatbot_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Session owner read messages" ON public.chatbot_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chatbot_sessions s WHERE s.id = session_id AND s.customer_id = auth.uid())
);
CREATE POLICY "Insert messages" ON public.chatbot_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Chatbot FAQ
CREATE TABLE public.chatbot_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active faq" ON public.chatbot_faq FOR SELECT USING (active = true);
CREATE POLICY "Admin manage faq" ON public.chatbot_faq FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Chatbot actions log
CREATE TABLE public.chatbot_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  order_id UUID,
  result TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read actions_log" ON public.chatbot_actions_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert actions_log" ON public.chatbot_actions_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Insert default settings
INSERT INTO public.chatbot_settings (id) VALUES (gen_random_uuid());
