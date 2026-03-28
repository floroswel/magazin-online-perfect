-- 1. GDPR consents table
CREATE TABLE IF NOT EXISTS public.gdpr_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  necessary boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert consent" ON public.gdpr_consents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read consent" ON public.gdpr_consents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update consent" ON public.gdpr_consents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_gdpr_consents_session ON public.gdpr_consents(session_id);

-- 2. Loyalty points trigger on confirmed order
CREATE OR REPLACE FUNCTION public.award_loyalty_points_on_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_order_total numeric;
  v_points integer;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    v_order_total := COALESCE(NEW.total, 0) - COALESCE(NEW.shipping_total, 0);
    IF v_order_total <= 0 OR NEW.user_id IS NULL THEN RETURN NEW; END IF;
    v_points := floor(v_order_total);
    IF v_points > 0 THEN
      INSERT INTO public.loyalty_points (user_id, points, action, description, order_id)
      VALUES (NEW.user_id, v_points, 'earn', 'Puncte pentru comanda #' || left(NEW.id::text, 8), NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty_on_confirm ON public.orders;
CREATE TRIGGER trg_award_loyalty_on_confirm
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points_on_confirm();

-- 3. RPC use_loyalty_points
CREATE OR REPLACE FUNCTION public.use_loyalty_points(p_user_id uuid, p_points_to_use integer, p_order_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_balance integer;
  v_redeem_value numeric;
BEGIN
  SELECT COALESCE(sum(points), 0)::integer INTO v_balance FROM public.loyalty_points WHERE user_id = p_user_id;
  IF p_points_to_use <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Puncte invalide');
  END IF;
  IF p_points_to_use > v_balance THEN
    RETURN jsonb_build_object('success', false, 'message', 'Puncte insuficiente. Ai ' || v_balance || ' puncte.');
  END IF;
  v_redeem_value := (p_points_to_use::numeric / 100) * 5;
  INSERT INTO public.loyalty_points (user_id, points, action, description, order_id)
  VALUES (p_user_id, -p_points_to_use, 'redeem', 'Utilizare ' || p_points_to_use || ' puncte = ' || v_redeem_value || ' RON discount', p_order_id);
  RETURN jsonb_build_object('success', true, 'discount', v_redeem_value, 'points_used', p_points_to_use, 'new_balance', v_balance - p_points_to_use);
END;
$$;

-- 4. Anonymize user data RPC for GDPR
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles SET
    full_name = 'DELETED',
    phone = NULL,
    avatar_url = NULL
  WHERE user_id = p_user_id;

  UPDATE public.addresses SET
    full_name = 'DELETED',
    phone = '0000000000',
    address = 'DELETED',
    city = 'DELETED',
    county = 'DELETED',
    postal_code = NULL
  WHERE user_id = p_user_id;

  UPDATE public.orders SET
    shipping_address = jsonb_build_object('fullName', 'DELETED', 'city', 'DELETED', 'address', 'DELETED'),
    billing_address = jsonb_build_object('fullName', 'DELETED')
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Date anonimizate');
END;
$$;

-- 5. SmartBill notification on confirm
CREATE OR REPLACE FUNCTION public.auto_smartbill_on_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES ('invoice', 'Facturare automata', 'Comanda #' || left(NEW.id::text, 8) || ' confirmata - generati factura SmartBill', '/admin/orders');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_smartbill_on_confirm ON public.orders;
CREATE TRIGGER trg_smartbill_on_confirm
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_smartbill_on_confirm();