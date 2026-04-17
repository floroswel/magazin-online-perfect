
-- Stock change log (product-level, not warehouse-level)
CREATE TABLE public.stock_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  sku TEXT,
  old_value INTEGER NOT NULL DEFAULT 0,
  new_value INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'manual',
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_change_log_product ON public.stock_change_log(product_id);
CREATE INDEX idx_stock_change_log_created ON public.stock_change_log(created_at DESC);

-- Stock reservations
CREATE TABLE public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'reserved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);

CREATE INDEX idx_stock_reservations_product ON public.stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_order ON public.stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_status ON public.stock_reservations(status);

-- Restock notifications
CREATE TABLE public.restock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  user_id UUID,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restock_notifications_product ON public.restock_notifications(product_id);
CREATE UNIQUE INDEX idx_restock_unique ON public.restock_notifications(product_id, email) WHERE notified = false;

-- Enable RLS
ALTER TABLE public.stock_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for stock_change_log (admin read/write)
CREATE POLICY "Authenticated users can read stock log" ON public.stock_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock log" ON public.stock_change_log FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for stock_reservations (admin read/write)
CREATE POLICY "Authenticated can read reservations" ON public.stock_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage reservations" ON public.stock_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for restock_notifications (anyone can sign up, admin can read all)
CREATE POLICY "Anyone can create restock notification" ON public.restock_notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read restock notifications" ON public.restock_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update restock notifications" ON public.restock_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
