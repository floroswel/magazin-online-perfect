
-- Import history table
CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual',
  file_name TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  import_mode TEXT NOT NULL DEFAULT 'create_and_update',
  scheduled_import_id UUID REFERENCES public.scheduled_imports(id) ON DELETE SET NULL,
  user_id UUID
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import_history" ON public.import_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend scheduled_imports with price calculation options
ALTER TABLE public.scheduled_imports 
  ADD COLUMN IF NOT EXISTS price_mode TEXT NOT NULL DEFAULT 'as_is',
  ADD COLUMN IF NOT EXISTS price_multiplier NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS price_margin NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_only_sync BOOLEAN NOT NULL DEFAULT false;
