
-- 11. custom_404_log — url_accessed is the actual column
DROP POLICY IF EXISTS "Anyone can insert 404 log" ON public.custom_404_log;
CREATE POLICY "Insert 404 log validated" ON public.custom_404_log
FOR INSERT WITH CHECK (
  url_accessed IS NOT NULL AND
  length(url_accessed) < 500
);

-- 12. gdpr_consents — no consent_type column; validate session_id instead
DROP POLICY IF EXISTS "Anon can insert consent" ON public.gdpr_consents;
DROP POLICY IF EXISTS "Auth can insert consent" ON public.gdpr_consents;
CREATE POLICY "Insert gdpr validated" ON public.gdpr_consents
FOR INSERT WITH CHECK (
  session_id IS NOT NULL AND
  (user_id IS NULL OR auth.uid() = user_id)
);

-- 13. recommendation_clicks
DROP POLICY IF EXISTS "Anyone can insert recommendation_clicks" ON public.recommendation_clicks;
CREATE POLICY "Insert recommendation validated" ON public.recommendation_clicks
FOR INSERT WITH CHECK (
  product_id IS NOT NULL AND
  recommended_product_id IS NOT NULL
);

-- 14. social_proof_analytics
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.social_proof_analytics;
CREATE POLICY "Insert social_proof validated" ON public.social_proof_analytics
FOR INSERT WITH CHECK (
  notification_type IS NOT NULL AND
  session_id IS NOT NULL
);
