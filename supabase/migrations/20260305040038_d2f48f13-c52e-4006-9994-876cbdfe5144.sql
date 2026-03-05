
CREATE POLICY "Authenticated users can read smartbill_sync_log"
  ON public.smartbill_sync_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert smartbill_sync_log"
  ON public.smartbill_sync_log FOR INSERT TO authenticated WITH CHECK (true);
