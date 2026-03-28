
-- Create trigger function for admin notification on new order
CREATE OR REPLACE FUNCTION public.notify_admin_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link)
  VALUES (
    'order',
    '🛒 Comandă nouă #' || left(NEW.id::text, 8),
    COALESCE(NEW.user_email, 'Client') || ' — ' || COALESCE(NEW.total, 0)::text || ' RON — ' || COALESCE(NEW.payment_method, 'N/A'),
    '/admin/orders'
  );
  RETURN NEW;
END;
$$;

-- Create trigger function for low stock notification  
CREATE OR REPLACE FUNCTION public.notify_admin_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
    INSERT INTO public.admin_notifications (type, title, message, link)
    VALUES (
      'stock',
      '📉 Stoc redus: ' || left(NEW.name, 50),
      'Doar ' || NEW.stock || ' buc. rămase!',
      '/admin/stock'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_notify_admin_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_order();

CREATE TRIGGER trg_notify_admin_low_stock
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_low_stock();
