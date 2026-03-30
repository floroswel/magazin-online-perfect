-- ═══════════════════════════════════════════════
-- 1. RESTOCK NOTIFICATIONS — restrict to admin only
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can read restock notifications" ON public.restock_notifications;
DROP POLICY IF EXISTS "Authenticated can update restock notifications" ON public.restock_notifications;

CREATE POLICY "Admins can read restock notifications"
  ON public.restock_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update restock notifications"
  ON public.restock_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 2. ORDERS — remove guest SELECT, keep auth-based
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Guest users can view guest orders" ON public.orders;
DROP POLICY IF EXISTS "Guest users can create orders" ON public.orders;

-- ═══════════════════════════════════════════════
-- 3. ORDER_ITEMS — remove guest SELECT & INSERT
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Guest users can view guest order items" ON public.order_items;
DROP POLICY IF EXISTS "Guest users can create order items" ON public.order_items;

-- ═══════════════════════════════════════════════
-- 4. SCENT QUIZ RESULTS — remove anon USING(true)
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Anon can view own session" ON public.scent_quiz_results;
-- Keep "Users can view own quiz results" (user_id = auth.uid())

-- ═══════════════════════════════════════════════
-- 5. RETURN REQUEST IMAGES — restrict to owner + admin
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Read return images" ON public.return_request_images;
DROP POLICY IF EXISTS "Insert return images" ON public.return_request_images;

CREATE POLICY "Owner or admin can read return images"
  ON public.return_request_images FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.returns r
      WHERE r.id = return_request_images.return_request_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert return images"
  ON public.return_request_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.returns r
      WHERE r.id = return_request_images.return_request_id
      AND r.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- ═══════════════════════════════════════════════
-- 6. STORAGE BUCKETS — make private
-- ═══════════════════════════════════════════════
UPDATE storage.buckets SET public = false WHERE id IN ('return-photos', 'return-request-images');

-- Storage policies for return-photos
DROP POLICY IF EXISTS "Owner can upload return photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin can read return photos" ON storage.objects;

CREATE POLICY "Owner can upload return photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('return-photos', 'return-request-images'));

CREATE POLICY "Owner or admin can read return photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('return-photos', 'return-request-images')
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ═══════════════════════════════════════════════
-- 7. SAFE_PAYMENT_METHODS — switch to SECURITY INVOKER
-- ═══════════════════════════════════════════════
DROP VIEW IF EXISTS public.safe_payment_methods;
CREATE VIEW public.safe_payment_methods
WITH (security_invoker = on) AS
  SELECT id, key, name, type, description, is_active, display_order,
         icon_url, extra_fee_type, extra_fee_value, min_amount, max_amount,
         allowed_counties, allowed_customer_groups, provider,
         bank_details, bnpl_config, pickup_location_id, payment_deadline_days
  FROM payment_methods
  WHERE is_active = true;