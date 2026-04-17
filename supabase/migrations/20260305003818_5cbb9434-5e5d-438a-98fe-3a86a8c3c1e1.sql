
-- ERP Integrations table
CREATE TABLE public.erp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'rest_api',
  template text,
  status text NOT NULL DEFAULT 'disconnected',
  api_base_url text,
  api_key text,
  auth_type text DEFAULT 'bearer',
  sync_products boolean DEFAULT false,
  sync_stock boolean DEFAULT false,
  sync_orders boolean DEFAULT false,
  sync_customers boolean DEFAULT false,
  sync_direction text DEFAULT 'erp_to_store',
  sync_frequency text DEFAULT 'hourly',
  stock_conflict_resolution text DEFAULT 'erp_wins',
  order_status_mapping jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage erp_integrations" ON public.erp_integrations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ERP field mappings
CREATE TABLE public.erp_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.erp_integrations(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'product',
  erp_field text NOT NULL,
  store_field text NOT NULL,
  transform text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_field_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage erp_field_mappings" ON public.erp_field_mappings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Outgoing webhooks
CREATE TABLE public.erp_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  destination_url text NOT NULL,
  secret_key text,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage erp_webhooks" ON public.erp_webhooks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Webhook logs (outgoing + incoming)
CREATE TABLE public.erp_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.erp_webhooks(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'outgoing',
  event_type text,
  url text,
  method text DEFAULT 'POST',
  request_payload jsonb,
  response_status integer,
  response_body text,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage erp_webhook_logs" ON public.erp_webhook_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sync logs
CREATE TABLE public.erp_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.erp_integrations(id) ON DELETE SET NULL,
  integration_name text,
  sync_type text NOT NULL,
  direction text NOT NULL DEFAULT 'pull',
  records_total integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  errors jsonb,
  status text NOT NULL DEFAULT 'success',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage erp_sync_logs" ON public.erp_sync_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
