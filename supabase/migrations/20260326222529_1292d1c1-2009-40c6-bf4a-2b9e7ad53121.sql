
-- AI Generator settings table
CREATE TABLE public.ai_generator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  tone text NOT NULL DEFAULT 'professional',
  format_diacritics boolean NOT NULL DEFAULT true,
  format_bullets boolean NOT NULL DEFAULT true,
  format_emojis boolean NOT NULL DEFAULT false,
  format_html boolean NOT NULL DEFAULT true,
  format_plain_text boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'ro',
  content_length text NOT NULL DEFAULT 'medium',
  content_length_min integer DEFAULT NULL,
  content_length_max integer DEFAULT NULL,
  manual_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_generator_settings" ON public.ai_generator_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AI Generator log table
CREATE TABLE public.ai_generator_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  action_type text NOT NULL DEFAULT 'description',
  generated_content text NOT NULL DEFAULT '',
  original_content text DEFAULT NULL,
  status text NOT NULL DEFAULT 'auto-saved',
  uniqueness_score real DEFAULT NULL,
  admin_user_id uuid NOT NULL,
  approved_by uuid DEFAULT NULL,
  approved_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generator_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_generator_log" ON public.ai_generator_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AI Bulk jobs table
CREATE TABLE public.ai_bulk_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL DEFAULT 'selection',
  target_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generation_targets jsonb NOT NULL DEFAULT '["description"]'::jsonb,
  total_products integer NOT NULL DEFAULT 0,
  completed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  error_log jsonb DEFAULT NULL,
  started_by uuid NOT NULL,
  started_at timestamptz DEFAULT NULL,
  finished_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_bulk_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_bulk_jobs" ON public.ai_bulk_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings row
INSERT INTO public.ai_generator_settings (enabled, tone, language, content_length, manual_approval)
VALUES (true, 'professional', 'ro', 'medium', false);
