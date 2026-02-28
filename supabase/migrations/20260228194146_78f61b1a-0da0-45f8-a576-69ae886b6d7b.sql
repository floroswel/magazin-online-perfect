
-- ============================================
-- FAZA 1: Extindere profiles (users/clienți)
-- ============================================

-- Adăugăm câmpuri enterprise la profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS fiscal_attributes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gdpr_consents jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_preferences jsonb DEFAULT '{"email": true, "sms": false, "push": false}',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS segments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS loyalty_tier text,
  ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orders_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at timestamptz;

-- ============================================
-- FAZA 2: Extindere user_roles → staff capabilities
-- ============================================

-- Tabel permisiuni granulare per rol (staff)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module text NOT NULL,
  can_create boolean DEFAULT false,
  can_read boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, module)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage role_permissions"
  ON public.role_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth users can view role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Staff metadata (2FA, IP whitelist, etc.)
CREATE TABLE IF NOT EXISTS public.staff_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  two_fa_enabled boolean DEFAULT false,
  two_fa_secret text,
  ip_whitelist text[] DEFAULT '{}',
  last_login_at timestamptz,
  last_login_ip text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage staff_metadata"
  ON public.staff_metadata FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own metadata"
  ON public.staff_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can update own metadata"
  ON public.staff_metadata FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FAZA 3: Extindere products
-- ============================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS warranty_months integer;

-- ============================================
-- FAZA 4: Product Variants
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text,
  barcode text,
  mpn text,
  ean text,
  attributes jsonb NOT NULL DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  old_price numeric,
  weight numeric,
  dimensions jsonb,
  warranty_months integer,
  image_url text,
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants viewable by everyone"
  ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Admins manage variants"
  ON public.product_variants FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- ============================================
-- FAZA 5: Product Attributes (sistem de atribute)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text DEFAULT 'select',
  is_filterable boolean DEFAULT true,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attributes viewable by everyone"
  ON public.product_attributes FOR SELECT USING (true);

CREATE POLICY "Admins manage attributes"
  ON public.product_attributes FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

CREATE TABLE IF NOT EXISTS public.attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  slug text NOT NULL,
  color_hex text,
  display_order integer DEFAULT 0,
  UNIQUE(attribute_id, slug)
);
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attr values viewable by everyone"
  ON public.attribute_values FOR SELECT USING (true);

CREATE POLICY "Admins manage attr values"
  ON public.attribute_values FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

-- ============================================
-- FAZA 6: Inventory (extins vs warehouse_stock)
-- ============================================

ALTER TABLE public.warehouse_stock
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id),
  ADD COLUMN IF NOT EXISTS reserved_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_in_warehouse text,
  ADD COLUMN IF NOT EXISTS batch text,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS serial_numbers jsonb DEFAULT '[]';

-- Extindere warehouses
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'physical';

-- ============================================
-- FAZA 7: Price Lists
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type text DEFAULT 'retail',
  customer_groups jsonb DEFAULT '[]',
  start_date timestamptz,
  end_date timestamptz,
  priority integer DEFAULT 0,
  round_to numeric DEFAULT 0.01,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price lists viewable by auth"
  ON public.price_lists FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage price lists"
  ON public.price_lists FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

CREATE TABLE IF NOT EXISTS public.prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  currency text DEFAULT 'RON',
  min_quantity integer DEFAULT 1,
  special_offer jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prices viewable by auth"
  ON public.prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage prices"
  ON public.prices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

CREATE INDEX IF NOT EXISTS idx_prices_variant ON public.prices(variant_id);
CREATE INDEX IF NOT EXISTS idx_prices_product ON public.prices(product_id);

-- ============================================
-- FAZA 8: Extindere orders
-- ============================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipping_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS marketplace_data jsonb;

-- Extindere order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id),
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 19,
  ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS serial_numbers jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS warranty_registered boolean DEFAULT false;

-- ============================================
-- FAZA 9: Invoices (facturi fiscale)
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  invoice_number text NOT NULL,
  series text DEFAULT 'MG',
  type text DEFAULT 'invoice',
  status text DEFAULT 'draft',
  
  -- Seller
  seller_name text,
  seller_cui text,
  seller_reg_com text,
  seller_address text,
  seller_bank text,
  seller_iban text,
  
  -- Buyer
  buyer_name text,
  buyer_cui text,
  buyer_address text,
  buyer_email text,
  buyer_phone text,
  
  -- Amounts
  subtotal numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  vat_rate numeric DEFAULT 19,
  discount_amount numeric DEFAULT 0,
  shipping_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  currency text DEFAULT 'RON',
  
  -- e-Factura
  efactura_xml text,
  efactura_id text,
  efactura_status text,
  uit_code text,
  
  issued_at timestamptz,
  due_at timestamptz,
  pdf_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Users view own invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = invoices.order_id AND orders.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric NOT NULL,
  vat_rate numeric DEFAULT 19,
  vat_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoice items"
  ON public.invoice_items FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Users view own invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i
    JOIN orders o ON o.id = i.order_id
    WHERE i.id = invoice_items.invoice_id AND o.user_id = auth.uid()
  ));

-- ============================================
-- FAZA 10: Shipments & Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  carrier text NOT NULL,
  awb_number text,
  status text DEFAULT 'pending',
  tracking_url text,
  label_url text,
  packages jsonb DEFAULT '[]',
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  shipping_cost numeric DEFAULT 0,
  cod_amount numeric DEFAULT 0,
  carrier_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage shipments"
  ON public.shipments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'orders_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'orders_manager'));

CREATE POLICY "Users view own shipments"
  ON public.shipments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = shipments.order_id AND orders.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  description text,
  event_date timestamptz,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage shipment events"
  ON public.shipment_events FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'orders_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'orders_manager'));

CREATE POLICY "Users view own shipment events"
  ON public.shipment_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.id = shipment_events.shipment_id AND o.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.courier_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT false,
  config_json jsonb DEFAULT '{}',
  default_pickup_address jsonb,
  pricing_rules jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.courier_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage courier configs"
  ON public.courier_configs FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth view courier configs"
  ON public.courier_configs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FAZA 11: Extindere returns (RMA)
-- ============================================

ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS rma_number text,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- ============================================
-- FAZA 12: Payment Methods & Transactions
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  provider text,
  is_active boolean DEFAULT true,
  config_json jsonb DEFAULT '{}',
  display_order integer DEFAULT 0,
  icon_url text,
  min_amount numeric DEFAULT 0,
  max_amount numeric,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment methods viewable by all"
  ON public.payment_methods FOR SELECT USING (true);

CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  payment_method_id uuid REFERENCES payment_methods(id),
  external_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'RON',
  status text DEFAULT 'pending',
  card_last_four text,
  card_brand text,
  installments_count integer,
  installments_provider text,
  provider_response jsonb,
  error_message text,
  refunded_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage transactions"
  ON public.payment_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Users view own transactions"
  ON public.payment_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()
  ));

-- ============================================
-- FAZA 13: Events (Audit Log extins)
-- ============================================

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS staff_id uuid;

-- ============================================
-- FAZA 14: Extindere integrations (App Store)
-- ============================================

ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS app_key text,
  ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS webhooks jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS logs jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS credentials_ref text;

-- ============================================
-- FAZA 15: Promotions & Price Rules
-- ============================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'draft',
  conditions jsonb DEFAULT '{}',
  discount_value numeric,
  discount_type text DEFAULT 'percentage',
  max_discount numeric,
  gift_product_id uuid REFERENCES products(id),
  bundle_products jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  max_uses_per_user integer DEFAULT 1,
  used_count integer DEFAULT 0,
  is_combinable boolean DEFAULT false,
  priority integer DEFAULT 0,
  badge_text text,
  banner_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotions viewable by all"
  ON public.promotions FOR SELECT USING (true);

CREATE POLICY "Admins manage promotions"
  ON public.promotions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'marketing'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'marketing'));

CREATE TABLE IF NOT EXISTS public.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  conditions jsonb DEFAULT '{}',
  discount_value numeric,
  discount_type text DEFAULT 'percentage',
  applies_to jsonb DEFAULT '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price rules viewable by auth"
  ON public.price_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage price rules"
  ON public.price_rules FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'marketing'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'marketing'));

-- ============================================
-- FAZA 16: Customer Groups
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  discount_percentage numeric DEFAULT 0,
  is_default boolean DEFAULT false,
  conditions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer groups viewable by auth"
  ON public.customer_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage customer groups"
  ON public.customer_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.customer_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.customer_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage group members"
  ON public.customer_group_members FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own memberships"
  ON public.customer_group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.group_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  UNIQUE(group_id, product_id, variant_id)
);
ALTER TABLE public.group_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group prices viewable by auth"
  ON public.group_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage group prices"
  ON public.group_prices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'products_manager'));

-- ============================================
-- FAZA 17: Notification system
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  channel text NOT NULL,
  subject_template text,
  body_template text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage notification templates"
  ON public.notification_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  template_key text,
  channel text NOT NULL,
  recipient text NOT NULL,
  subject text,
  body text,
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- FAZA 18: Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON public.shipments(awb_number);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_vat ON public.profiles(vat_number);
