
-- ====== AUTOMATIONS / RULE BUILDER ======
CREATE TABLE public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL, -- e.g. order.created, payment.confirmed, stock.low
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of {field, operator, value}
  actions jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of {type, params}
  is_active boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automations"
  ON public.automations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====== AUTOMATION RUNS (execution log) ======
CREATE TABLE public.automation_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  trigger_payload jsonb DEFAULT '{}'::jsonb,
  actions_executed jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'success', -- success, error, skipped
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view automation runs"
  ON public.automation_runs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System insert automation runs"
  ON public.automation_runs FOR INSERT
  WITH CHECK (true);

-- ====== WEBHOOK QUEUE IMPROVEMENTS ======
-- Add retry/dead-letter columns to existing webhook_queue table
ALTER TABLE public.webhook_queue
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS dead_letter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS headers jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_webhook_queue_next_retry ON public.webhook_queue (next_retry_at) WHERE status = 'failed' AND dead_letter = false;
CREATE INDEX IF NOT EXISTS idx_webhook_queue_idempotency ON public.webhook_queue (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations (trigger_event) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON public.automation_runs (automation_id);

-- Trigger for updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
