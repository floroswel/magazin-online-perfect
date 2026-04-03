
CREATE OR REPLACE FUNCTION public.create_exit_intent_coupon(
  p_code text,
  p_valid_until timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.coupons (
    code, discount_type, discount_value, is_active,
    max_uses, max_uses_per_customer, first_order_only,
    valid_until, description, applies_to
  ) VALUES (
    p_code, 'percentage', 10, true,
    1, 1, true,
    p_valid_until,
    'Exit intent - 10% prima comandă (auto-generat)',
    'all'
  );
END;
$$;
