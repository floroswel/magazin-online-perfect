
-- Fix overly permissive INSERT on automation_runs - restrict to service role / admin
DROP POLICY "System insert automation runs" ON public.automation_runs;

CREATE POLICY "Admins insert automation runs"
  ON public.automation_runs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
