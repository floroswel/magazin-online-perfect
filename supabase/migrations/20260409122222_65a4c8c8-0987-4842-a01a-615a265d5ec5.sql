
-- =====================================================
-- CRITICAL FIX 1: custom_scripts - restrict to admin only
-- =====================================================
DROP POLICY IF EXISTS "Active scripts public read" ON public.custom_scripts;
DROP POLICY IF EXISTS "Public can read active scripts" ON public.custom_scripts;
DROP POLICY IF EXISTS "Anyone can read active scripts" ON public.custom_scripts;

-- Only admins can read custom scripts
CREATE POLICY "Only admins can read custom scripts"
ON public.custom_scripts FOR SELECT
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CRITICAL FIX 2: exit_intent_usage - enforce ownership
-- =====================================================
DROP POLICY IF EXISTS "Public insert exit intent" ON public.exit_intent_usage;
DROP POLICY IF EXISTS "Anyone can insert exit intent usage" ON public.exit_intent_usage;
DROP POLICY IF EXISTS "Anon insert exit intent" ON public.exit_intent_usage;

CREATE POLICY "Exit intent insert with validation"
ON public.exit_intent_usage FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_email IS NOT NULL
  AND length(customer_email) <= 255
  AND public.is_valid_email(customer_email)
  AND (user_id IS NULL OR user_id = auth.uid())
  AND length(COALESCE(customer_name, '')) <= 200
  AND length(COALESCE(customer_phone, '')) <= 30
  AND length(COALESCE(customer_address, '')) <= 500
);

-- =====================================================
-- CRITICAL FIX 3: storage - enforce path ownership for returns
-- =====================================================
DROP POLICY IF EXISTS "Owner can upload return photos" ON storage.objects;

CREATE POLICY "Owner can upload return photos with path check"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('return-photos', 'return-request-images')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- WARN FIX 1: customization-uploads - enforce path ownership
-- =====================================================
DROP POLICY IF EXISTS "Authenticated upload customization files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload customization files" ON storage.objects;

CREATE POLICY "Users upload customization with path check"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customization-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- WARN FIX 2: review-photos-uploads - enforce path ownership
-- =====================================================
DROP POLICY IF EXISTS "Anyone can upload review photos" ON storage.objects;

CREATE POLICY "Users upload review photos with path check"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- WARN FIX 3: pricing_rules - restrict to authenticated only
-- =====================================================
DROP POLICY IF EXISTS "Public can read pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Anyone can read active pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Pricing rules public read" ON public.pricing_rules;

CREATE POLICY "Authenticated read active pricing rules"
ON public.pricing_rules FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins read all pricing rules"
ON public.pricing_rules FOR SELECT
TO authenticated
USING (public.is_admin());
