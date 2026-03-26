
-- TBI Bank settings table
CREATE TABLE public.tbi_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  username text DEFAULT '',
  password text DEFAULT '',
  store_id text DEFAULT '',
  demo_mode boolean NOT NULL DEFAULT true,
  sftl_public_key text DEFAULT NULL,
  merchant_public_key text DEFAULT NULL,
  enabled_products jsonb NOT NULL DEFAULT '["BNPL V1"]'::jsonb,
  checkout_display_name text NOT NULL DEFAULT 'Plată în rate prin TBI Bank',
  show_snippet boolean NOT NULL DEFAULT false,
  show_footer_icon boolean NOT NULL DEFAULT false,
  delivery_restriction text NOT NULL DEFAULT 'any',
  allowed_delivery_ids jsonb DEFAULT '[]'::jsonb,
  condition_countries jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_customer_groups jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_categories jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  min_order_value decimal NOT NULL DEFAULT 100,
  max_order_value decimal DEFAULT NULL,
  limit_by_customer_type boolean NOT NULL DEFAULT false,
  limit_individual_pct integer DEFAULT 100,
  limit_legal_pct integer DEFAULT 100,
  allowed_ips text DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tbi_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage tbi_settings" ON public.tbi_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read tbi_settings" ON public.tbi_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.tbi_settings (enabled) VALUES (false);

-- TBI transactions table
CREATE TABLE public.tbi_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid DEFAULT NULL,
  tbi_credit_application_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  status_id_raw text DEFAULT NULL,
  motiv text DEFAULT NULL,
  encrypted_payload_sent text DEFAULT NULL,
  last_callback_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tbi_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage tbi_transactions" ON public.tbi_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
