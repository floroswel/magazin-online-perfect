-- Add gift wrap columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_wrap boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_message text;

-- Update use_loyalty_points with minimum 50 points requirement
CREATE OR REPLACE FUNCTION public.use_loyalty_points(p_user_id uuid, p_points_to_use integer, p_order_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_balance integer;
  v_redeem_value numeric;
BEGIN
  SELECT COALESCE(sum(points), 0)::integer INTO v_balance FROM public.loyalty_points WHERE user_id = p_user_id;
  IF p_points_to_use <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Puncte invalide');
  END IF;
  IF p_points_to_use < 50 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Minim 50 puncte necesare pentru răscumpărare');
  END IF;
  IF p_points_to_use > v_balance THEN
    RETURN jsonb_build_object('success', false, 'message', 'Puncte insuficiente. Ai ' || v_balance || ' puncte.');
  END IF;
  v_redeem_value := (p_points_to_use::numeric / 100) * 5;
  INSERT INTO public.loyalty_points (user_id, points, action, description, order_id)
  VALUES (p_user_id, -p_points_to_use, 'redeem', 'Utilizare ' || p_points_to_use || ' puncte = ' || v_redeem_value || ' RON discount', p_order_id);
  RETURN jsonb_build_object('success', true, 'discount', v_redeem_value, 'points_used', p_points_to_use, 'new_balance', v_balance - p_points_to_use);
END;
$$;

-- Create trigger function for cancelling loyalty points on return
CREATE OR REPLACE FUNCTION public.cancel_loyalty_points_on_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_earned_points integer;
BEGIN
  IF NEW.status = 'returned' AND (OLD.status IS NULL OR OLD.status != 'returned') THEN
    -- Find total earned points for this order
    SELECT COALESCE(SUM(points), 0)::integer INTO v_earned_points
    FROM public.loyalty_points
    WHERE order_id = NEW.id AND action = 'earn' AND points > 0;

    IF v_earned_points > 0 THEN
      INSERT INTO public.loyalty_points (user_id, points, action, description, order_id)
      VALUES (NEW.user_id, -v_earned_points, 'cancel', 'Anulare puncte — Retur comanda #' || left(NEW.order_number::text, 8), NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS cancel_loyalty_on_return ON public.orders;
CREATE TRIGGER cancel_loyalty_on_return
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_loyalty_points_on_return();

-- Create instagram_feed_images table
CREATE TABLE IF NOT EXISTS public.instagram_feed_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.instagram_feed_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instagram feed" ON public.instagram_feed_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage instagram feed" ON public.instagram_feed_images
  FOR ALL USING (public.is_admin());
