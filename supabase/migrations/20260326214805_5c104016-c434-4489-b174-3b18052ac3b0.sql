
-- Gift Cards
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  purchaser_user_id UUID,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_by UUID,
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gift cards" ON public.gift_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own gift cards" ON public.gift_cards
  FOR SELECT TO authenticated
  USING (purchaser_user_id = auth.uid() OR redeemed_by = auth.uid());

-- Gift card transactions
CREATE TABLE public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'debit',
  order_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gc transactions" ON public.gift_card_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Wishlists (shareable)
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Lista mea de dorințe',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wishlists" ON public.wishlists
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public wishlists viewable" ON public.wishlists
  FOR SELECT TO anon
  USING (is_public = true);

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_at_add NUMERIC,
  UNIQUE(wishlist_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wishlist items" ON public.wishlist_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()));

CREATE POLICY "Public wishlist items viewable" ON public.wishlist_items
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.is_public = true));

-- Price drop alerts
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  target_price NUMERIC,
  original_price NUMERIC NOT NULL,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own price alerts" ON public.price_alerts
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Referral Program
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_reward_type TEXT DEFAULT 'percentage',
  referrer_reward_value NUMERIC DEFAULT 10,
  referred_reward_type TEXT DEFAULT 'percentage',
  referred_reward_value NUMERIC DEFAULT 10,
  referrer_coupon_id UUID,
  referred_coupon_id UUID,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Social proof / recent purchases log
CREATE TABLE public.social_proof_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_image TEXT,
  buyer_city TEXT,
  buyer_first_name TEXT,
  event_type TEXT NOT NULL DEFAULT 'purchase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proof_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read social proof" ON public.social_proof_events
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage social proof" ON public.social_proof_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all chats" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon insert chat" ON public.chat_messages
  FOR INSERT TO anon
  WITH CHECK (true);
