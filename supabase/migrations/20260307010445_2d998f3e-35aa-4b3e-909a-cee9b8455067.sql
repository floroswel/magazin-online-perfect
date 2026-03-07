
-- Extend abandoned_carts for 3-email sequence and recovery tokens
ALTER TABLE public.abandoned_carts 
  ADD COLUMN IF NOT EXISTS recovery_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS recovery_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'abandoned',
  ADD COLUMN IF NOT EXISTS email_1_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_2_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_3_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_coupon_code text,
  ADD COLUMN IF NOT EXISTS lost boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovered_order_id uuid;

-- Create index for cron job lookups
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_token ON public.abandoned_carts(recovery_token) WHERE recovery_token IS NOT NULL;

-- RLS: admin can do everything, users can see their own
CREATE POLICY "Admin full access abandoned_carts" ON public.abandoned_carts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users see own abandoned_carts" ON public.abandoned_carts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users upsert own abandoned_carts" ON public.abandoned_carts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own abandoned_carts" ON public.abandoned_carts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
