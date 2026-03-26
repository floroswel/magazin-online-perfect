
-- Wallet settings table
CREATE TABLE public.wallet_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  checkout_display_name text NOT NULL DEFAULT 'Plata Wallet',
  delivery_method_restriction text NOT NULL DEFAULT 'any',
  allowed_delivery_method_ids jsonb DEFAULT '[]'::jsonb,
  usage_mode text NOT NULL DEFAULT 'partial',
  condition_countries jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_customer_groups jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_categories jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_min_order_value decimal DEFAULT NULL,
  condition_max_order_value decimal DEFAULT NULL,
  limit_by_customer_type boolean NOT NULL DEFAULT false,
  limit_individual_pct integer DEFAULT 100,
  limit_legal_pct integer DEFAULT 100,
  allowed_ips text DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage wallet_settings" ON public.wallet_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read wallet_settings" ON public.wallet_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.wallet_settings (enabled) VALUES (false);

-- Customer wallets table
CREATE TABLE public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  available_balance decimal NOT NULL DEFAULT 0,
  pending_balance decimal NOT NULL DEFAULT 0,
  total_earned decimal NOT NULL DEFAULT 0,
  total_used decimal NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own wallet" ON public.customer_wallets FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admin can manage all wallets" ON public.customer_wallets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.customer_wallets(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'credit_manual',
  amount decimal NOT NULL,
  direction text NOT NULL DEFAULT 'credit',
  status text NOT NULL DEFAULT 'available',
  order_id uuid DEFAULT NULL,
  return_id uuid DEFAULT NULL,
  description text NOT NULL DEFAULT '',
  created_by_admin_id uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admin can manage all transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
