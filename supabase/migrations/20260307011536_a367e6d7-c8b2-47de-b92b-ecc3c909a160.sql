
-- Recommendation clicks tracking
CREATE TABLE IF NOT EXISTS public.recommendation_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL DEFAULT 'cross_sell',
  user_id uuid,
  session_id text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted boolean DEFAULT false,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  revenue numeric DEFAULT 0
);

ALTER TABLE public.recommendation_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recommendation_clicks" ON public.recommendation_clicks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert recommendation_clicks" ON public.recommendation_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Add auto_generated flag to product_relations
ALTER TABLE public.product_relations ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;
ALTER TABLE public.product_relations ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
ALTER TABLE public.product_relations ADD COLUMN IF NOT EXISTS co_purchase_count integer DEFAULT 0;

-- Free shipping threshold setting (use app_settings)
-- No new table needed, we use app_settings with key 'free_shipping_threshold'
