ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_sold integer DEFAULT 0;

UPDATE public.products p
SET total_sold = COALESCE(sub.cnt, 0)
FROM (
  SELECT oi.product_id, SUM(oi.quantity)::integer as cnt
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status IN ('delivered', 'shipped', 'processing', 'confirmed')
  GROUP BY oi.product_id
) sub
WHERE p.id = sub.product_id;

CREATE INDEX IF NOT EXISTS idx_products_total_sold ON public.products(total_sold DESC);