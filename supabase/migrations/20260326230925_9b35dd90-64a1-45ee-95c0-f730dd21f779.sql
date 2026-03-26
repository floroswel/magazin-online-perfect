
-- Bank Transfer Settings
CREATE TABLE public.bank_transfer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  company_name text NOT NULL DEFAULT '',
  cui text NOT NULL DEFAULT '',
  checkout_display_name text NOT NULL DEFAULT 'Transfer bancar / Ordin de plată',
  customer_message text,
  payment_term_value integer NOT NULL DEFAULT 3,
  payment_term_unit text NOT NULL DEFAULT 'days',
  auto_cancel_expired boolean NOT NULL DEFAULT false,
  business_days_only boolean NOT NULL DEFAULT false,
  delivery_restriction text NOT NULL DEFAULT 'any',
  allowed_delivery_method_ids jsonb DEFAULT '[]'::jsonb,
  condition_countries jsonb DEFAULT '{"mode":"any","values":[]}'::jsonb,
  condition_customer_groups jsonb DEFAULT '{"mode":"any","values":[],"exclude":[]}'::jsonb,
  condition_categories jsonb DEFAULT '{"mode":"any","values":[],"exclude":[]}'::jsonb,
  min_order_value numeric,
  max_order_value numeric,
  limit_by_customer_type boolean NOT NULL DEFAULT false,
  limit_individual_min numeric,
  limit_individual_max numeric,
  limit_legal_min numeric,
  limit_legal_max numeric,
  allowed_ips text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transfer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bank_transfer_settings" ON public.bank_transfer_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read bank_transfer_settings" ON public.bank_transfer_settings
  FOR SELECT TO authenticated USING (true);

-- Insert default row
INSERT INTO public.bank_transfer_settings (id) VALUES (gen_random_uuid());

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id uuid REFERENCES public.bank_transfer_settings(id) ON DELETE CASCADE NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  iban text NOT NULL DEFAULT '',
  account_holder text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'RON',
  branch text,
  swift_bic text,
  is_default boolean NOT NULL DEFAULT false,
  show_on_documents boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bank_accounts" ON public.bank_accounts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read bank_accounts" ON public.bank_accounts
  FOR SELECT TO authenticated USING (true);

-- Bank Transfer Payments
CREATE TABLE public.bank_transfer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_deadline date NOT NULL,
  payment_reference text NOT NULL DEFAULT '',
  amount_expected numeric NOT NULL DEFAULT 0,
  amount_received numeric NOT NULL DEFAULT 0,
  bank_transaction_ref text,
  received_at date,
  internal_note text,
  confirmed_by_admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transfer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bank_transfer_payments" ON public.bank_transfer_payments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own bank_transfer_payments" ON public.bank_transfer_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = bank_transfer_payments.order_id
        AND o.user_id = auth.uid()
    )
  );
