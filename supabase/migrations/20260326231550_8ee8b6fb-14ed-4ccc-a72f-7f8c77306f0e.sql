
-- SmartBill Settings (dedicated table replacing app_settings JSON)
CREATE TABLE public.smartbill_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  email text NOT NULL DEFAULT '',
  token text NOT NULL DEFAULT '',
  cif text NOT NULL DEFAULT '',
  generate_invoices_enabled boolean NOT NULL DEFAULT false,
  sync_stocks_enabled boolean NOT NULL DEFAULT false,
  invoice_series text NOT NULL DEFAULT 'FACT',
  document_type text NOT NULL DEFAULT 'invoice',
  auto_generate boolean NOT NULL DEFAULT false,
  auto_generate_on_status text NOT NULL DEFAULT 'confirmed',
  save_client_to_db boolean NOT NULL DEFAULT true,
  save_products_to_db boolean NOT NULL DEFAULT false,
  default_tax_name text NOT NULL DEFAULT 'Normala',
  default_tax_percentage int NOT NULL DEFAULT 19,
  currency text NOT NULL DEFAULT 'RON',
  send_email_to_client boolean NOT NULL DEFAULT false,
  order_reference_template text NOT NULL DEFAULT 'Comanda #{order_id}',
  warehouse_name text,
  product_identifier text NOT NULL DEFAULT 'code',
  auto_sync_stocks boolean NOT NULL DEFAULT false,
  sync_frequency text NOT NULL DEFAULT 'daily',
  unknown_products_action text NOT NULL DEFAULT 'ignore',
  include_shipping boolean NOT NULL DEFAULT true,
  shipping_product_name text NOT NULL DEFAULT 'Transport',
  default_meas_unit text NOT NULL DEFAULT 'buc',
  sandbox boolean NOT NULL DEFAULT false,
  series_proforma text NOT NULL DEFAULT 'PROF',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smartbill_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage smartbill_settings" ON public.smartbill_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read smartbill_settings" ON public.smartbill_settings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.smartbill_settings (id) VALUES (gen_random_uuid());

-- SmartBill Invoices
CREATE TABLE public.smartbill_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL DEFAULT '',
  invoice_series text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT 'invoice',
  smartbill_url text,
  pdf_cached_path text,
  status text NOT NULL DEFAULT 'issued',
  issued_at date,
  generated_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smartbill_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage smartbill_invoices" ON public.smartbill_invoices
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own smartbill_invoices" ON public.smartbill_invoices
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = smartbill_invoices.order_id AND o.user_id = auth.uid())
  );

-- SmartBill Stock Sync Log
CREATE TABLE public.smartbill_stock_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL DEFAULT 'manual',
  products_processed int NOT NULL DEFAULT 0,
  products_updated int NOT NULL DEFAULT 0,
  products_not_found int NOT NULL DEFAULT 0,
  errors_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  details jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.smartbill_stock_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage smartbill_stock_sync_log" ON public.smartbill_stock_sync_log
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
