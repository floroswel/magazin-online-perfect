-- ── error_log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('error','warn','info','fatal')),
  message text NOT NULL,
  stack text,
  url text,
  user_agent text,
  user_id uuid,
  release_version text,
  context_json jsonb DEFAULT '{}'::jsonb,
  fingerprint text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid
);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON public.error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_fingerprint ON public.error_log(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_log_resolved ON public.error_log(resolved) WHERE resolved = false;

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert errors" ON public.error_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view all errors" ON public.error_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update errors" ON public.error_log
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete errors" ON public.error_log
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ── uptime_log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uptime_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  status_code integer,
  response_time_ms integer,
  is_healthy boolean NOT NULL DEFAULT true,
  error_message text
);
CREATE INDEX IF NOT EXISTS idx_uptime_log_created_at ON public.uptime_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_log_endpoint ON public.uptime_log(endpoint, created_at DESC);

ALTER TABLE public.uptime_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view uptime" ON public.uptime_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ── health_check_results ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  check_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok','degraded','down')),
  details_json jsonb DEFAULT '{}'::jsonb,
  duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_health_check_created_at ON public.health_check_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_name ON public.health_check_results(check_name, created_at DESC);

ALTER TABLE public.health_check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view health checks" ON public.health_check_results
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ── retention helpers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_observability_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.uptime_log WHERE created_at < now() - interval '30 days';
  DELETE FROM public.health_check_results WHERE created_at < now() - interval '30 days';
  DELETE FROM public.error_log WHERE created_at < now() - interval '90 days' AND resolved = true;
$$;