
-- Suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT NULL,
  email text DEFAULT NULL,
  phone text DEFAULT NULL,
  address text DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read suppliers" ON public.suppliers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Purchase orders (covers both supplier orders and goods reception)
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'supplier_order',
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name_snapshot text DEFAULT NULL,
  warehouse_id uuid DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  internal_note text DEFAULT NULL,
  total_acquisition_cost numeric DEFAULT 0,
  created_by text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read purchase_orders" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot text DEFAULT NULL,
  variant_id uuid DEFAULT NULL,
  sku text DEFAULT NULL,
  ean text DEFAULT NULL,
  quantity_ordered integer NOT NULL DEFAULT 0,
  quantity_received integer NOT NULL DEFAULT 0,
  acquisition_cost_net numeric DEFAULT 0,
  new_sale_price numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read purchase_order_items" ON public.purchase_order_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage purchase_order_items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Stock reception log
CREATE TABLE public.stock_reception_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid DEFAULT NULL,
  quantity_added integer NOT NULL DEFAULT 0,
  warehouse_id uuid DEFAULT NULL,
  previous_stock integer DEFAULT 0,
  new_stock integer DEFAULT 0,
  received_by text DEFAULT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_reception_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stock_reception_log" ON public.stock_reception_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage stock_reception_log" ON public.stock_reception_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Module toggle
INSERT INTO public.app_settings (key, value_json, description)
VALUES ('stock_manager_enabled', 'false'::jsonb, 'Global toggle for Stock Manager (Comenzi Furnizor / Receptie) module')
ON CONFLICT DO NOTHING;
