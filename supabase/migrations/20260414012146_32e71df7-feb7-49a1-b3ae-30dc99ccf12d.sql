
-- Registru Reclamatii (OG 21/1992)
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  complaint_date date NOT NULL DEFAULT CURRENT_DATE,
  channel text NOT NULL DEFAULT 'site',
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  order_id uuid REFERENCES public.orders(id),
  order_number text,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'in_analiza',
  response_date date,
  resolution text,
  admin_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='complaints' AND policyname='Admins manage complaints') THEN
    CREATE POLICY "Admins manage complaints" ON public.complaints
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

CREATE OR REPLACE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Login Attempts (Brute Force Protection)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='login_attempts' AND policyname='Anyone can insert login attempts') THEN
    CREATE POLICY "Anyone can insert login attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='login_attempts' AND policyname='Admins can read login attempts') THEN
    CREATE POLICY "Admins can read login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='login_attempts' AND policyname='Admins can delete login attempts') THEN
    CREATE POLICY "Admins can delete login attempts" ON public.login_attempts FOR DELETE TO authenticated USING (public.is_admin());
  END IF;
END $$;

-- Fraud flags on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fraud_flags jsonb DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fraud_status text DEFAULT NULL;

-- Invoices bucket for PDF storage
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Admins can manage invoices bucket') THEN
    CREATE POLICY "Admins can manage invoices bucket" ON storage.objects
      FOR ALL TO authenticated USING (bucket_id = 'invoices' AND public.is_admin())
      WITH CHECK (bucket_id = 'invoices' AND public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can read own invoices') THEN
    CREATE POLICY "Users can read own invoices" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
