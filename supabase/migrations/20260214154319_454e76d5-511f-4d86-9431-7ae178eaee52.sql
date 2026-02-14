
-- Returns / RMA table
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text NOT NULL,
  details text,
  resolution text,
  admin_notes text,
  refund_amount numeric DEFAULT 0,
  tracking_number text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own returns
CREATE POLICY "Users can view own returns"
ON public.returns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own returns"
ON public.returns FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins and orders_manager can do everything
CREATE POLICY "Admins can manage all returns"
ON public.returns FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'orders_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'orders_manager'::app_role));

CREATE TRIGGER update_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
