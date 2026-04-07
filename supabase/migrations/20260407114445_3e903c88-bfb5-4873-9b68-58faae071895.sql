
-- 3. subscription_orders — only service role (no user_id column, system-managed)
DROP POLICY IF EXISTS "Auth users own subscription_orders" ON public.subscription_orders;
CREATE POLICY "Service role subscription_orders insert" ON public.subscription_orders
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 4. tracking_events — fix: no user_id, use order_id join
DROP POLICY IF EXISTS "Auth tracking select own" ON public.tracking_events;
CREATE POLICY "Auth tracking select own" ON public.tracking_events
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = tracking_events.order_id
    AND o.user_id = auth.uid()
  )
);
