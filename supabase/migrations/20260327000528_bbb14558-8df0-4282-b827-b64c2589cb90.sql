
-- Add new columns to custom_scripts
ALTER TABLE public.custom_scripts
  ADD COLUMN IF NOT EXISTS internal_reference text,
  ADD COLUMN IF NOT EXISTS inline_content text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS external_async boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_defer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_type text DEFAULT 'text/javascript',
  ADD COLUMN IF NOT EXISTS external_crossorigin text,
  ADD COLUMN IF NOT EXISTS external_custom_attributes jsonb,
  ADD COLUMN IF NOT EXISTS pages jsonb DEFAULT '["all_pages"]'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_note text,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid;

-- Migrate existing data
UPDATE public.custom_scripts SET
  internal_reference = COALESCE(name, 'Script fără nume'),
  inline_content = CASE WHEN script_type IN ('javascript','html','css') THEN content ELSE NULL END,
  external_url = CASE WHEN script_type = 'external' THEN content ELSE NULL END,
  script_type = CASE WHEN script_type = 'external' THEN 'external' ELSE 'inline' END,
  location = CASE
    WHEN location = 'body_start' THEN 'body'
    WHEN location = 'body_end' THEN 'footer'
    WHEN location IN ('header','checkout','after_checkout','all_pages') THEN 'header'
    ELSE location
  END,
  pages = CASE
    WHEN location = 'checkout' THEN '["checkout"]'::jsonb
    WHEN location = 'after_checkout' THEN '["after_checkout"]'::jsonb
    ELSE '["all_pages"]'::jsonb
  END;

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.custom_scripts_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES public.custom_scripts(id) ON DELETE SET NULL,
  action text NOT NULL,
  admin_user_id uuid,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_scripts_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage script audit logs" ON public.custom_scripts_audit_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
