
-- Add cashback settings
ALTER TABLE public.wallet_settings
  ADD COLUMN IF NOT EXISTS cashback_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cashback_pct numeric NOT NULL DEFAULT 5;

-- Trigger function: award cashback when order is delivered
CREATE OR REPLACE FUNCTION public.award_wallet_cashback_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cashback_enabled boolean;
  v_cashback_pct numeric;
  v_order_total numeric;
  v_cashback numeric;
  v_wallet_id uuid;
  v_already_awarded boolean;
BEGIN
  -- Only fire when status changes TO delivered/livrat
  IF NEW.status NOT IN ('delivered', 'livrat') THEN RETURN NEW; END IF;
  IF OLD.status IS NOT NULL AND OLD.status IN ('delivered', 'livrat') THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  -- Check if cashback is enabled
  SELECT cashback_enabled, cashback_pct INTO v_cashback_enabled, v_cashback_pct
  FROM public.wallet_settings LIMIT 1;

  IF NOT COALESCE(v_cashback_enabled, false) OR COALESCE(v_cashback_pct, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  -- Check if already awarded for this order
  SELECT EXISTS(
    SELECT 1 FROM public.wallet_transactions
    WHERE order_id = NEW.id AND type = 'cashback' AND direction = 'credit'
  ) INTO v_already_awarded;

  IF v_already_awarded THEN RETURN NEW; END IF;

  -- Calculate cashback
  v_order_total := COALESCE(NEW.total, 0) - COALESCE(NEW.shipping_total, 0);
  IF v_order_total <= 0 THEN RETURN NEW; END IF;

  v_cashback := round(v_order_total * v_cashback_pct / 100, 2);
  IF v_cashback <= 0 THEN RETURN NEW; END IF;

  -- Ensure wallet exists
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE customer_id = NEW.user_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.customer_wallets (customer_id) VALUES (NEW.user_id) RETURNING id INTO v_wallet_id;
  END IF;

  -- Create transaction
  INSERT INTO public.wallet_transactions (wallet_id, customer_id, type, amount, direction, status, order_id, description)
  VALUES (
    v_wallet_id, NEW.user_id, 'cashback', v_cashback, 'credit', 'available', NEW.id,
    'Cashback ' || v_cashback_pct || '% — comanda #' || COALESCE(NEW.order_number, left(NEW.id::text, 8))
  );

  -- Update wallet balance
  UPDATE public.customer_wallets
  SET available_balance = available_balance + v_cashback,
      total_earned = total_earned + v_cashback,
      updated_at = now()
  WHERE id = v_wallet_id;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_wallet_cashback_on_delivery ON public.orders;
CREATE TRIGGER trg_wallet_cashback_on_delivery
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_wallet_cashback_on_delivery();
