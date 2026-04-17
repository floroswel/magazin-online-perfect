
-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons are viewable by authenticated users" ON public.coupons FOR SELECT TO authenticated USING (is_active = true);

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupon usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loyalty program
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  action TEXT NOT NULL, -- 'purchase', 'review', 'referral', 'bonus', 'spent'
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loyalty points" ON public.loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loyalty levels config
CREATE TABLE public.loyalty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(4,2) DEFAULT 0,
  color TEXT DEFAULT '#CD7F32',
  icon TEXT DEFAULT '🥉',
  benefits TEXT[] DEFAULT '{}'
);
ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Loyalty levels are viewable by everyone" ON public.loyalty_levels FOR SELECT USING (true);

-- Insert default loyalty levels
INSERT INTO public.loyalty_levels (name, min_points, discount_percentage, color, icon, benefits) VALUES
  ('Bronze', 0, 0, '#CD7F32', '🥉', ARRAY['Acumulare puncte la fiecare comandă', 'Acces la oferte exclusive']),
  ('Silver', 500, 3, '#C0C0C0', '🥈', ARRAY['3% reducere la toate comenzile', 'Livrare gratuită peste 100 lei', 'Acces prioritar la flash sales']),
  ('Gold', 2000, 5, '#FFD700', '🥇', ARRAY['5% reducere la toate comenzile', 'Livrare gratuită', 'Cadou la ziua de naștere', 'Suport prioritar']),
  ('Platinum', 5000, 8, '#E5E4E2', '💎', ARRAY['8% reducere la toate comenzile', 'Livrare expresă gratuită', 'Acces la produse exclusive', 'Manager dedicat', 'Retur extins 60 zile']);

-- Recently viewed products
CREATE TABLE public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recently viewed" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Product questions & answers
CREATE TABLE public.product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable by everyone" ON public.product_questions FOR SELECT USING (true);
CREATE POLICY "Users can create own questions" ON public.product_questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Review images
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Review images are viewable by everyone" ON public.review_images FOR SELECT USING (true);
CREATE POLICY "Users can add review images" ON public.review_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_images.review_id AND reviews.user_id = auth.uid())
);

-- Product comparison lists
CREATE TABLE public.comparison_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.comparison_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own comparisons" ON public.comparison_lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add coupon_id to orders
ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN payment_installments JSONB;
