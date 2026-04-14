
-- Add missing column that validate_coupon references
ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC DEFAULT NULL;

-- Recreate validate_coupon to be robust
CREATE OR REPLACE FUNCTION public.validate_coupon(p_coupon_code text, p_cart_total numeric, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon record;
  v_usage_count integer;
  v_user_usage integer;
  v_order_count integer;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_coupon_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod invalid');
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod inactiv');
  END IF;

  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Acest cod nu este încă activ');
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cod expirat');
  END IF;

  IF v_coupon.min_order_value IS NOT NULL AND p_cart_total < v_coupon.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'message',
      format('Valoare minimă comandă: %s lei', v_coupon.min_order_value));
  END IF;

  -- Check first_order_only
  IF v_coupon.first_order_only = true AND p_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_order_count
    FROM public.orders
    WHERE user_id = p_user_id
      AND status NOT IN ('cancelled', 'draft');
    IF v_order_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Acest cod este valabil doar pentru prima comandă');
    END IF;
  END IF;

  -- Check total usage limit
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
      RETURN jsonb_build_object('valid', false, 'message', 'Ai folosit deja acest cod de reducere');
    END IF;
  END IF;

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
$function$;
