
DROP POLICY IF EXISTS "Anyone can manage own session" ON public.user_sessions;
CREATE POLICY "Anyone can insert sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners update own session" ON public.user_sessions FOR UPDATE USING (user_id IS NOT NULL AND auth.uid() = user_id) WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Admins manage all sessions" ON public.user_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
