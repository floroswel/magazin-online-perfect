
DROP POLICY IF EXISTS "Anon insert chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON public.sms_log;
DROP POLICY IF EXISTS "System can insert subscription orders" ON public.subscription_orders;
DROP POLICY IF EXISTS "Service role can manage tracking events" ON public.tracking_events;
