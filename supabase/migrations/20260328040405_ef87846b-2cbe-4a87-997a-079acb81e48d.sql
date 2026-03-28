
-- Function to generate a unique random 5-digit order number (10000-99999)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_num text;
  v_exists boolean;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' OR NEW.order_number LIKE 'VNZ-%' THEN
    LOOP
      v_num := (floor(random() * 90000 + 10000))::integer::text;
      SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_num) INTO v_exists;
      EXIT WHEN NOT v_exists;
    END LOOP;
    NEW.order_number := v_num;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_order_number ON public.orders;
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();
