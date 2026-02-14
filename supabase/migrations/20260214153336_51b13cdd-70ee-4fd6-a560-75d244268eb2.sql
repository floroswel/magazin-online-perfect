
CREATE TABLE public.scheduled_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  feed_url text NOT NULL,
  interval_minutes integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  last_result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled imports"
ON public.scheduled_imports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_scheduled_imports_updated_at
BEFORE UPDATE ON public.scheduled_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
