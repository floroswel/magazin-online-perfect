
-- NETOPIA Settings
CREATE TABLE public.netopia_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  merchant_signature text NOT NULL DEFAULT '',
  netopia_cert_path text,
  merchant_key_path text,
  netopia_cert_filename text,
  merchant_key_filename text,
  netopia_cert_uploaded_at timestamptz,
  merchant_key_uploaded_at timestamptz,
  currency text NOT NULL DEFAULT 'order_currency',
  demo_mode boolean NOT NULL DEFAULT true,
  checkout_display_name text NOT NULL DEFAULT 'Plată cu cardul (NETOPIA Payments)',
  show_footer_icon boolean NOT NULL DEFAULT true,
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

ALTER TABLE public.netopia_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage netopia_settings" ON public.netopia_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read netopia_settings" ON public.netopia_settings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.netopia_settings (id) VALUES (gen_random_uuid());

-- NETOPIA Transactions
CREATE TABLE public.netopia_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  netopia_order_id text NOT NULL DEFAULT '',
  netopia_purchase_id text,
  action text,
  error_code text,
  error_message text,
  original_amount numeric,
  processed_amount numeric,
  pan_masked text,
  token_id text,
  token_expiration_date timestamptz,
  payment_instrument_id text,
  status text NOT NULL DEFAULT 'pending',
  ipn_raw_xml text,
  ipn_received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.netopia_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage netopia_transactions" ON public.netopia_transactions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own netopia_transactions" ON public.netopia_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = netopia_transactions.order_id AND o.user_id = auth.uid()
    )
  );

-- Private storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('netopia-certificates', 'netopia-certificates', false);

-- Only admins can manage certificate files
CREATE POLICY "Admins upload netopia certs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'netopia-certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read netopia certs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'netopia-certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete netopia certs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'netopia-certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update netopia certs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'netopia-certificates' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'netopia-certificates' AND public.has_role(auth.uid(), 'admin'));
