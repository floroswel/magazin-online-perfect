
-- 5. back_in_stock_notifications (no user_id column)
DROP POLICY IF EXISTS "Anyone can subscribe to back in stock" ON public.back_in_stock_notifications;
CREATE POLICY "Insert back_in_stock validated" ON public.back_in_stock_notifications
FOR INSERT WITH CHECK (
  email IS NOT NULL AND
  product_id IS NOT NULL
);

-- 6. corporate_gift_requests
DROP POLICY IF EXISTS "Anyone can submit corporate request" ON public.corporate_gift_requests;
CREATE POLICY "Insert corporate_gift validated" ON public.corporate_gift_requests
FOR INSERT WITH CHECK (
  email IS NOT NULL AND
  company_name IS NOT NULL
);

-- 7. exit_intent_usage (no session_id column, use customer_email)
DROP POLICY IF EXISTS "Anon and authenticated can insert exit_intent_usage" ON public.exit_intent_usage;
CREATE POLICY "Insert exit_intent validated" ON public.exit_intent_usage
FOR INSERT WITH CHECK (
  customer_email IS NOT NULL
);

-- 8. newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Insert newsletter validated" ON public.newsletter_subscribers
FOR INSERT WITH CHECK (
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 9. restock_notifications
DROP POLICY IF EXISTS "Anyone can create restock notification" ON public.restock_notifications;
CREATE POLICY "Insert restock validated" ON public.restock_notifications
FOR INSERT WITH CHECK (
  email IS NOT NULL AND
  product_id IS NOT NULL
);

-- 10. scent_quiz_results
DROP POLICY IF EXISTS "Anyone can insert quiz results" ON public.scent_quiz_results;
CREATE POLICY "Insert quiz validated" ON public.scent_quiz_results
FOR INSERT WITH CHECK (
  session_id IS NOT NULL OR
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);
