
-- ============================================================
-- CRITICAL SECURITY HARDENING
-- ============================================================

-- 1. PAYMENT_METHODS: Remove public SELECT (exposes config_json with API keys)
DROP POLICY IF EXISTS "Payment methods viewable by all" ON public.payment_methods;

CREATE POLICY "Admin read payment_methods"
ON public.payment_methods FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Safe view for checkout (excludes config_json, sandbox_mode, etc)
CREATE OR REPLACE VIEW public.safe_payment_methods AS
SELECT id, key, name, type, description, is_active, display_order, icon_url,
       extra_fee_type, extra_fee_value, min_amount, max_amount, 
       allowed_counties, allowed_customer_groups, provider,
       bank_details, bnpl_config, pickup_location_id, payment_deadline_days
FROM public.payment_methods
WHERE is_active = true;

GRANT SELECT ON public.safe_payment_methods TO anon, authenticated;

-- 2-6. Remove broad authenticated read from sensitive settings tables
DROP POLICY IF EXISTS "Authenticated read netopia_settings" ON public.netopia_settings;
DROP POLICY IF EXISTS "Authenticated read smartbill_settings" ON public.smartbill_settings;
DROP POLICY IF EXISTS "Authenticated read sameday_settings" ON public.sameday_settings;
DROP POLICY IF EXISTS "Anyone can read tbi_settings" ON public.tbi_settings;
DROP POLICY IF EXISTS "Anyone can read paypo_settings" ON public.paypo_settings;

-- 7. SUPPLIERS: Remove public read
DROP POLICY IF EXISTS "Public can read suppliers" ON public.suppliers;

-- 8. BANK_ACCOUNTS: Remove broad authenticated read
DROP POLICY IF EXISTS "Anyone can read bank_accounts" ON public.bank_accounts;

-- 9. SMS_CAMPAIGNS: Enable RLS + admin only
ALTER TABLE IF EXISTS public.sms_campaigns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_campaigns' AND policyname = 'Admin manage sms_campaigns') THEN
    CREATE POLICY "Admin manage sms_campaigns" ON public.sms_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 10. GDPR_CONSENTS: Restrict access
DROP POLICY IF EXISTS "Anyone can read consent" ON public.gdpr_consents;
DROP POLICY IF EXISTS "Anyone can update consent" ON public.gdpr_consents;
DROP POLICY IF EXISTS "Anyone can insert consent" ON public.gdpr_consents;

CREATE POLICY "Users read own consent" ON public.gdpr_consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin read all consents" ON public.gdpr_consents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can insert consent" ON public.gdpr_consents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert consent" ON public.gdpr_consents FOR INSERT TO authenticated WITH CHECK (true);

-- 11. STOCK_RESERVATIONS: Remove overly permissive
DROP POLICY IF EXISTS "Authenticated can manage reservations" ON public.stock_reservations;
DROP POLICY IF EXISTS "Authenticated can read reservations" ON public.stock_reservations;
CREATE POLICY "Admin manage stock_reservations" ON public.stock_reservations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. STOCK_CHANGE_LOG: Admin only
DROP POLICY IF EXISTS "Authenticated can read stock_change_log" ON public.stock_change_log;
DROP POLICY IF EXISTS "Authenticated can insert stock_change_log" ON public.stock_change_log;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_change_log' AND policyname = 'Admin manage stock_change_log') THEN
    CREATE POLICY "Admin manage stock_change_log" ON public.stock_change_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 13. SMARTBILL_SYNC_LOG: Admin only
DROP POLICY IF EXISTS "Authenticated can read smartbill_sync_log" ON public.smartbill_sync_log;
DROP POLICY IF EXISTS "Authenticated can insert smartbill_sync_log" ON public.smartbill_sync_log;

-- 14. TRACKING_EVENTS: Remove overly broad
DROP POLICY IF EXISTS "Authenticated users can read tracking events" ON public.tracking_events;

-- 15. RESTOCK_NOTIFICATIONS: Restrict
DROP POLICY IF EXISTS "Authenticated can read restock_notifications" ON public.restock_notifications;
