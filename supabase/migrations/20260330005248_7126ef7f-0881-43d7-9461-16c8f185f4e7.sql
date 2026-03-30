
-- Re-apply: Remove public SELECT policy on return-photos storage
DROP POLICY IF EXISTS "Anyone can view return photos" ON storage.objects;

-- Re-apply: Remove overly permissive smartbill_sync_log SELECT
DROP POLICY IF EXISTS "Authenticated users can read smartbill_sync_log" ON public.smartbill_sync_log;

-- Re-apply: Remove anonymous UPDATE on chatbot_sessions
DROP POLICY IF EXISTS "Anon update sessions" ON public.chatbot_sessions;

-- Re-apply: Remove overly permissive stock_change_log SELECT
DROP POLICY IF EXISTS "Authenticated users can read stock log" ON public.stock_change_log;

-- Re-apply: Restrict bank_transfer_settings
DROP POLICY IF EXISTS "Anyone can read bank_transfer_settings" ON public.bank_transfer_settings;
CREATE POLICY "Admins can read bank_transfer_settings"
  ON public.bank_transfer_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Re-apply: Restrict wallet_settings
DROP POLICY IF EXISTS "Anyone can read wallet_settings" ON public.wallet_settings;
CREATE POLICY "Admins can read wallet_settings"
  ON public.wallet_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix warehouse_stock: restrict to admin only
DROP POLICY IF EXISTS "Auth can view warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Admins can view warehouse stock"
  ON public.warehouse_stock FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix integrations: restrict to admin only
DROP POLICY IF EXISTS "Auth can view integrations" ON public.integrations;
CREATE POLICY "Admins can view integrations"
  ON public.integrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix safe_payment_methods view: ensure SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_payment_methods;
CREATE VIEW public.safe_payment_methods
  WITH (security_invoker = on)
AS
SELECT id, key, name, type, description, is_active, display_order, icon_url,
       extra_fee_type, extra_fee_value, min_amount, max_amount,
       allowed_counties, allowed_customer_groups, provider, bank_details,
       bnpl_config, pickup_location_id, payment_deadline_days
FROM public.payment_methods
WHERE is_active = true;
