
-- Create burn_logs table
CREATE TABLE IF NOT EXISTS public.burn_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  burn_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 60,
  mood text,
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.burn_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own burn logs" ON public.burn_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own burn logs" ON public.burn_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own burn logs" ON public.burn_logs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own burn logs" ON public.burn_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  answers_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz results" ON public.quiz_results FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert quiz results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can insert quiz results" ON public.quiz_results FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- Add scent columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS scent_family text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS scent_intensity integer DEFAULT 2;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS burn_hours integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS occasion_tags text[] DEFAULT '{}';

-- Add company fields to app_settings defaults
-- Add IBAN, bank, EUIPO, website to company_info
-- (done via app_settings upsert, not schema change)

-- Create VENTUZA brand if not exists
INSERT INTO public.brands (name, slug, description)
VALUES ('VENTUZA', 'ventuza', 'Lumânări artizanale din ceară de soia, create cu dragoste în România.')
ON CONFLICT (slug) DO NOTHING;
