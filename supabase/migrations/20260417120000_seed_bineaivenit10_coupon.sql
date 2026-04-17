-- Seed welcome coupon BINEAIVENIT10 (10% off, once per user, 1 year validity)
-- Schema matches public.coupons + existing validate_coupon RPC (p_coupon_code, p_cart_total, p_user_id)

INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  is_active,
  valid_from,
  valid_until,
  max_uses_per_customer,
  min_order_value,
  description,
  applies_to,
  first_order_only
) VALUES (
  'BINEAIVENIT10',
  'percentage',
  10,
  true,
  now(),
  now() + interval '1 year',
  1,
  0,
  'Reducere 10% clienți noi',
  'all',
  false
)
ON CONFLICT (code) DO NOTHING;

-- Ensure storefront can validate coupons via RPC (SECURITY DEFINER already bypasses RLS on coupons read)
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
