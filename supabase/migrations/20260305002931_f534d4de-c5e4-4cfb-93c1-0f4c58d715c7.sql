
-- Add city and is_active to warehouses
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Stock transfers between warehouses
CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  sku text,
  notes text,
  transferred_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stock_transfers" ON public.stock_transfers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add fulfillment_warehouse_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_warehouse_id uuid REFERENCES public.warehouses(id);
