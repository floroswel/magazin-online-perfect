
-- PayPo settings table
CREATE TABLE public.paypo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  client_id text DEFAULT '',
  client_secret text DEFAULT '',
  currency text NOT NULL DEFAULT 'RON',
  demo_mode boolean NOT NULL DEFAULT true,
  show_snippet boolean NOT NULL DEFAULT false,
  checkout_display_name text NOT NULL DEFAULT 'PayPo — Cumpără acum, plătești în 30 de zile',
  show_footer_icon boolean NOT NULL DEFAULT false,
  delivery_restriction text NOT NULL DEFAULT 'any',
  allowed_delivery_ids jsonb DEFAULT '[]'::jsonb,
  condition_countries jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_customer_groups jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_categories jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  min_order_value decimal NOT NULL DEFAULT 50,
  max_order_value decimal NOT NULL DEFAULT 800,
  limit_by_customer_type boolean NOT NULL DEFAULT false,
  limit_individual_pct integer DEFAULT 100,
  limit_legal_pct integer DEFAULT 100,
  allowed_ips text DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage paypo_settings" ON public.paypo_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read paypo_settings" ON public.paypo_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.paypo_settings (enabled) VALUES (false);

-- PayPo transactions table
CREATE TABLE public.paypo_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid DEFAULT NULL,
  paypo_transaction_id text DEFAULT NULL,
  paypo_reference_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'new',
  settlement_status text DEFAULT NULL,
  amount_bani integer NOT NULL DEFAULT 0,
  redirect_url text DEFAULT NULL,
  last_notification_at timestamptz DEFAULT NULL,
  hmac_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypo_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage paypo_transactions" ON public.paypo_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PayPo refunds table
CREATE TABLE public.paypo_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypo_transaction_id text NOT NULL,
  order_id uuid DEFAULT NULL,
  return_id uuid DEFAULT NULL,
  reference_refund_id text DEFAULT NULL,
  amount_bani integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypo_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage paypo_refunds" ON public.paypo_refunds FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PayPo OAuth token cache
CREATE TABLE public.paypo_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypo_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage paypo_oauth_tokens" ON public.paypo_oauth_tokens FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
