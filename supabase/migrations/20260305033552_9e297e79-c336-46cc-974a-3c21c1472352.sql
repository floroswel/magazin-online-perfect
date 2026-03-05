
-- Extend affiliates table with application fields
ALTER TABLE public.affiliates 
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS promotion_plan text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS available_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS discount_code text,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cookie_duration_days integer DEFAULT 30;

-- Affiliate payout requests
CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  status text NOT NULL DEFAULT 'pending',
  reference_number text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payout_requests
  FOR SELECT TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can request payouts" ON public.affiliate_payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access payout requests" ON public.affiliate_payout_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Affiliate materials (promotional banners)
CREATE TABLE IF NOT EXISTS public.affiliate_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view materials" ON public.affiliate_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access materials" ON public.affiliate_materials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add affiliate_id to orders for tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.affiliates(id);

-- Storage bucket for affiliate materials
INSERT INTO storage.buckets (id, name, public) VALUES ('affiliate-materials', 'affiliate-materials', true)
ON CONFLICT (id) DO NOTHING;
