
-- Mokka integration settings (singleton row)
CREATE TABLE public.mokka_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id text,
  secret_key text,
  api_url text NOT NULL DEFAULT 'https://demo-backend.mokka.ro',
  demo_mode boolean NOT NULL DEFAULT true,
  enabled_snippet boolean NOT NULL DEFAULT true,
  accepted_terms text[] NOT NULL DEFAULT '{3}',
  interest_rate numeric(5,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 0,
  checkout_label text DEFAULT 'Credit Online - Mokka',
  show_footer_icon boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 5,
  shipping_methods_type text NOT NULL DEFAULT 'all',
  shipping_methods text[] DEFAULT '{}',
  country_type text NOT NULL DEFAULT 'all',
  selected_countries text[] DEFAULT '{}',
  customer_group_type text NOT NULL DEFAULT 'all',
  selected_customer_groups uuid[] DEFAULT '{}',
  excluded_customer_groups uuid[] DEFAULT '{}',
  category_type text NOT NULL DEFAULT 'all',
  selected_categories uuid[] DEFAULT '{}',
  excluded_categories uuid[] DEFAULT '{}',
  order_value_type text NOT NULL DEFAULT 'all',
  min_order_value numeric(10,2) DEFAULT 100,
  max_order_value numeric(10,2) DEFAULT 5000,
  differentiated_limit boolean NOT NULL DEFAULT false,
  ip_whitelist_enabled boolean NOT NULL DEFAULT false,
  ip_whitelist text[] DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mokka_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mokka settings"
  ON public.mokka_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.mokka_settings (id) VALUES (gen_random_uuid());

-- Mokka integration logs
CREATE TABLE public.mokka_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  method text NOT NULL,
  order_id text,
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  ip_address text
);

ALTER TABLE public.mokka_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mokka logs"
  ON public.mokka_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_mokka_logs_created_at ON public.mokka_logs (created_at DESC);
CREATE INDEX idx_mokka_logs_order_id ON public.mokka_logs (order_id);
CREATE INDEX idx_mokka_logs_method ON public.mokka_logs (method);
