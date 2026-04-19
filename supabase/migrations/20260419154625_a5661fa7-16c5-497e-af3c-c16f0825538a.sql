-- 1. Add snapshot column to order_items to preserve product name after deletion
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name_snapshot text;

-- 2. Backfill snapshot for existing rows
UPDATE public.order_items oi
SET product_name_snapshot = p.name
FROM public.products p
WHERE oi.product_id = p.id
  AND oi.product_name_snapshot IS NULL;

-- 3. Trigger to auto-fill snapshot on insert/update
CREATE OR REPLACE FUNCTION public.set_order_item_product_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_name_snapshot IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT name INTO NEW.product_name_snapshot FROM public.products WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_item_snapshot ON public.order_items;
CREATE TRIGGER trg_set_order_item_snapshot
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_item_product_snapshot();

-- 4. Replace FK on order_items.product_id with ON DELETE SET NULL
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 5. Cascade-delete transient references when a product is removed
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey,
  ADD CONSTRAINT cart_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.comparison_lists
  DROP CONSTRAINT IF EXISTS comparison_lists_product_id_fkey,
  ADD CONSTRAINT comparison_lists_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.back_in_stock_notifications
  DROP CONSTRAINT IF EXISTS back_in_stock_notifications_product_id_fkey,
  ADD CONSTRAINT back_in_stock_notifications_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- favorites and recently_viewed (if exist with FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'favorites_product_id_fkey') THEN
    ALTER TABLE public.favorites DROP CONSTRAINT favorites_product_id_fkey;
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'recently_viewed_product_id_fkey') THEN
    ALTER TABLE public.recently_viewed DROP CONSTRAINT recently_viewed_product_id_fkey;
    ALTER TABLE public.recently_viewed ADD CONSTRAINT recently_viewed_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;