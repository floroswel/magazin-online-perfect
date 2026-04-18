DROP POLICY IF EXISTS "Anyone can add comparisons" ON public.product_comparisons;
CREATE POLICY "Session can add own comparisons"
  ON public.product_comparisons FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 8);

DROP POLICY IF EXISTS "Anyone can delete comparisons" ON public.product_comparisons;
CREATE POLICY "Session can delete own comparisons"
  ON public.product_comparisons FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) >= 8);