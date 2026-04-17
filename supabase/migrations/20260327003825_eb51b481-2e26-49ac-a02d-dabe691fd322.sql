
-- Scent quiz results
CREATE TABLE IF NOT EXISTS public.scent_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID,
  answers JSONB NOT NULL DEFAULT '[]',
  recommended_products JSONB DEFAULT '[]',
  purchased_product_id UUID REFERENCES public.products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scent_quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert quiz results" ON public.scent_quiz_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quiz results" ON public.scent_quiz_results FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anon can view own session" ON public.scent_quiz_results FOR SELECT TO anon USING (true);

-- Back in stock notifications  
CREATE TABLE IF NOT EXISTS public.back_in_stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);
ALTER TABLE public.back_in_stock_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe to back in stock" ON public.back_in_stock_notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Candle subscription plans (store config)
CREATE TABLE IF NOT EXISTS public.candle_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_ron NUMERIC NOT NULL,
  candles_per_month INT NOT NULL DEFAULT 1,
  scent_choice BOOLEAN NOT NULL DEFAULT false,
  color_choice BOOLEAN NOT NULL DEFAULT false,
  extra_discount_pct INT NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candle_subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON public.candle_subscription_plans FOR SELECT TO anon, authenticated USING (active = true);

-- Corporate gift requests
CREATE TABLE IF NOT EXISTS public.corporate_gift_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  units_needed INT NOT NULL DEFAULT 10,
  personalization_details TEXT,
  desired_delivery_date DATE,
  budget_range TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.corporate_gift_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit corporate request" ON public.corporate_gift_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view corporate requests" ON public.corporate_gift_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subscription plans
INSERT INTO public.candle_subscription_plans (name, price_ron, candles_per_month, scent_choice, color_choice, extra_discount_pct, description, features) VALUES
('Starter', 39, 1, false, false, 0, 'O lumânare surpriză pe lună', '["1 lumânare medie/lună (valoare 50 RON)","Parfum ales de noi (surpriză)","Livrare gratuită","-22% față de prețul normal"]'),
('Classic', 69, 2, true, false, 0, 'Două lumânări cu parfumul ales de tine', '["2 lumânări medii/lună","Tu alegi parfumul","Livrare gratuită","Acces early la colecții noi"]'),
('Premium', 119, 3, true, true, 20, 'Trei lumânări + surpriză, totul personalizat', '["3 lumânări + 1 produs surpriză","Parfum + culoare la alegere","Ambalaj premium","-20% la orice comandă suplimentară"]');
