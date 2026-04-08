ALTER TABLE public.staff_metadata DROP COLUMN IF EXISTS two_fa_secret;

DROP POLICY IF EXISTS "Staff can view own metadata" ON public.staff_metadata;
CREATE POLICY "Staff can view own metadata"
  ON public.staff_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can update own metadata" ON public.staff_metadata;
CREATE POLICY "Staff can update own metadata"
  ON public.staff_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);