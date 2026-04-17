
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Restore stock for each order item
    UPDATE public.products p
    SET stock = p.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;

    -- Log stock movements
    INSERT INTO public.stock_movements (product_id, quantity, type, reason, reference_id)
    SELECT
      oi.product_id,
      oi.quantity,
      'return',
      'Comanda anulată #' || COALESCE(NEW.order_number, left(NEW.id::text, 8)),
      NEW.id::text
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_cancel();
