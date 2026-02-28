
-- ============================================
-- Integration SDK / App Store Framework
-- ============================================

-- Connector Registry (available integrations catalog)
CREATE TABLE IF NOT EXISTS public.connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL, -- 'courier', 'payment', 'marketplace', 'erp', 'accounting', 'marketing', 'analytics'
  description text,
  icon_url text,
  version text DEFAULT '1.0.0',
  min_platform_version text DEFAULT '1.0.0',
  permissions text[] DEFAULT '{}', -- ['read:orders', 'write:shipments', ...]
  settings_schema jsonb DEFAULT '{"fields": []}', -- auto-generated UI config
  events_subscribed text[] DEFAULT '{}', -- ['order.created', 'payment.captured']
  webhooks_provided text[] DEFAULT '{}', -- ['shipment.updated']
  is_official boolean DEFAULT true,
  is_published boolean DEFAULT true,
  author text,
  documentation_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connectors viewable by auth"
  ON public.connectors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage connectors"
  ON public.connectors FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Connector Instances (installed integrations per store)
CREATE TABLE IF NOT EXISTS public.connector_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  config_json jsonb DEFAULT '{}', -- API keys, endpoints, field mappings (encrypted at app level)
  enabled boolean DEFAULT false,
  status text DEFAULT 'inactive', -- 'active', 'error', 'syncing', 'inactive'
  last_sync_at timestamptz,
  last_error text,
  error_count integer DEFAULT 0,
  sync_frequency_minutes integer DEFAULT 60,
  installed_at timestamptz DEFAULT now(),
  installed_by uuid,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.connector_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage connector instances"
  ON public.connector_instances FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_connector_instances_connector ON public.connector_instances(connector_id);

-- Sync Logs (history of sync operations)
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_instance_id uuid NOT NULL REFERENCES connector_instances(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'import_products', 'export_orders', 'sync_stock', 'webhook_received'
  status text DEFAULT 'running', -- 'running', 'success', 'error', 'partial'
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  items_created integer DEFAULT 0,
  items_updated integer DEFAULT 0,
  items_skipped integer DEFAULT 0,
  error_details jsonb,
  request_data jsonb, -- what was sent
  response_data jsonb, -- what was received
  duration_ms integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sync logs"
  ON public.sync_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_sync_logs_instance ON public.sync_logs(connector_instance_id);
CREATE INDEX idx_sync_logs_started ON public.sync_logs(started_at DESC);

-- Integration Events (event bus for integrations)
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'order.created', 'payment.captured', 'stock.low'
  entity_type text NOT NULL, -- 'order', 'product', 'shipment'
  entity_id text,
  payload jsonb DEFAULT '{}',
  source text DEFAULT 'system', -- 'system', connector key
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamptz
);
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage events"
  ON public.integration_events FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_events_type ON public.integration_events(event_type);
CREATE INDEX idx_events_unprocessed ON public.integration_events(processed, created_at) WHERE NOT processed;

-- Webhook Queue (incoming/outgoing webhooks)
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_instance_id uuid REFERENCES connector_instances(id) ON DELETE SET NULL,
  direction text NOT NULL, -- 'incoming', 'outgoing'
  url text,
  method text DEFAULT 'POST',
  headers jsonb DEFAULT '{}',
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending', -- 'pending', 'processing', 'delivered', 'failed', 'retrying'
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 5,
  next_retry_at timestamptz,
  response_status integer,
  response_body text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhook queue"
  ON public.webhook_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_webhook_pending ON public.webhook_queue(status, next_retry_at) WHERE status IN ('pending', 'retrying');

-- Enable realtime for integration events
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_logs;
