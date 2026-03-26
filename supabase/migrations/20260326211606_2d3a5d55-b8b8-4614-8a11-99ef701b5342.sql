-- Fix stock_reservations: use order_id to scope to user's orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_reservations' AND policyname = 'Users view own stock_reservations') THEN
    CREATE POLICY "Users view own stock_reservations" ON public.stock_reservations FOR SELECT TO authenticated 
    USING (
      order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Fix loyalty_points: Remove self-insert
DROP POLICY IF EXISTS "Users can insert own loyalty points" ON public.loyalty_points;

-- Fix tracking_events
DROP POLICY IF EXISTS "Authenticated users can view tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Anyone can view tracking events" ON public.tracking_events;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracking_events' AND policyname = 'Users view own tracking_events') THEN
    CREATE POLICY "Users view own tracking_events" ON public.tracking_events FOR SELECT TO authenticated 
    USING (
      order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- Fix smartbill_sync_log
DROP POLICY IF EXISTS "Authenticated users can view smartbill logs" ON public.smartbill_sync_log;
DROP POLICY IF EXISTS "Anyone can view smartbill logs" ON public.smartbill_sync_log;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smartbill_sync_log' AND policyname = 'Admins view smartbill_sync_log') THEN
    CREATE POLICY "Admins view smartbill_sync_log" ON public.smartbill_sync_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Fix app_settings: Remove overly public access
DROP POLICY IF EXISTS "Public can view settings" ON public.app_settings;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Anon can view public settings') THEN
    CREATE POLICY "Anon can view public settings" ON public.app_settings FOR SELECT TO anon USING (
      key IN ('store_branding', 'theme_settings', 'homepage_settings', 'footer_settings', 'gdpr_settings', 'cookie_settings', 'seo_settings', 'currency_settings', 'checkout_settings', 'cart_settings', 'footer_badges', 'menu_config')
    );
  END IF;
END $$;
