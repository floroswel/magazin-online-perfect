
CREATE TABLE public.exit_intent_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  customer_address TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exit_intent_email ON public.exit_intent_usage(customer_email);
CREATE INDEX idx_exit_intent_phone ON public.exit_intent_usage(customer_phone);
CREATE INDEX idx_exit_intent_name ON public.exit_intent_usage(customer_name);
CREATE INDEX idx_exit_intent_code ON public.exit_intent_usage(coupon_code);

ALTER TABLE public.exit_intent_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon and authenticated can insert exit_intent_usage"
  ON public.exit_intent_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can read exit_intent_usage"
  ON public.exit_intent_usage FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- DB function to check if a customer already used an exit-intent coupon
CREATE OR REPLACE FUNCTION public.check_exit_intent_fraud(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exit_intent_usage
    WHERE
      (p_email IS NOT NULL AND lower(trim(customer_email)) = lower(trim(p_email)))
      OR (p_phone IS NOT NULL AND regexp_replace(customer_phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g'))
      OR (p_name IS NOT NULL AND lower(trim(customer_name)) = lower(trim(p_name)))
      OR (p_address IS NOT NULL AND lower(trim(customer_address)) = lower(trim(p_address)))
  );
$$;
