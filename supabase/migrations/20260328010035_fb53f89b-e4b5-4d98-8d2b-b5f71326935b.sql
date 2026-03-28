
-- BUG #1: Add brand_id FK column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- BUG #4: Stock decrement trigger on order_items insert
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_order_item();

-- BUG #5: Server-side coupon validation RPC
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code text,
  p_cart_total numeric,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon record;
  v_usage_count integer;
  v_user_usage integer;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = upper(p_coupon_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod invalid');
  END IF;

  -- Check active
  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod inactiv');
  END IF;

  -- Check date range
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Acest cod nu este încă activ');
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod expirat');
  END IF;

  -- Check min order value
  IF v_coupon.min_order_value IS NOT NULL AND p_cart_total < v_coupon.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'message', 
      format('Valoare minimă comandă: %s lei', v_coupon.min_order_value));
  END IF;

  -- Check global usage limit
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT COALESCE(v_coupon.used_count, 0) INTO v_usage_count;
    IF v_usage_count >= v_coupon.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Limita de utilizări a fost atinsă');
    END IF;
  END IF;

  -- Check per-user usage limit
  IF p_user_id IS NOT NULL AND v_coupon.max_uses_per_customer IS NOT NULL THEN
    SELECT count(*) INTO v_user_usage
    FROM public.coupon_usage
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
    
    IF v_user_usage >= v_coupon.max_uses_per_customer THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Ai folosit deja acest cod de numărul maxim de ori');
    END IF;
  END IF;

  -- Valid!
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'max_discount_amount', v_coupon.max_discount_amount,
    'includes_free_shipping', COALESCE(v_coupon.includes_free_shipping, false),
    'combine_with_codes', COALESCE(v_coupon.combine_with_codes, false),
    'message', 'Cod valid!'
  );
END;
$$;
