
-- Sameday Settings
CREATE TABLE public.sameday_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  sandbox_mode boolean NOT NULL DEFAULT true,
  production_api_url text NOT NULL DEFAULT 'https://api.sameday.ro',
  auth_token text,
  token_expires_at timestamptz,
  default_pickup_point_id int,
  default_contact_person_id int,
  default_service_id int,
  default_package_type int NOT NULL DEFAULT 2,
  default_awb_payment int NOT NULL DEFAULT 1,
  default_weight numeric(8,2) NOT NULL DEFAULT 1.00,
  auto_generate boolean NOT NULL DEFAULT false,
  auto_generate_on_status text NOT NULL DEFAULT 'processing',
  send_tracking_email boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_settings" ON public.sameday_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read sameday_settings" ON public.sameday_settings
  FOR SELECT TO authenticated USING (true);
INSERT INTO public.sameday_settings (id) VALUES (gen_random_uuid());

-- Sameday Pickup Points
CREATE TABLE public.sameday_pickup_points (
  id int PRIMARY KEY,
  county_id int,
  county_name text,
  county_code text,
  city_id int,
  city_name text,
  address text,
  alias text,
  status boolean NOT NULL DEFAULT true,
  contact_persons jsonb DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_pickup_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_pickup_points" ON public.sameday_pickup_points
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read sameday_pickup_points" ON public.sameday_pickup_points
  FOR SELECT TO authenticated USING (true);

-- Sameday Services
CREATE TABLE public.sameday_services (
  id int PRIMARY KEY,
  name text NOT NULL,
  service_code text,
  delivery_type_id int,
  delivery_type_name text,
  is_default boolean NOT NULL DEFAULT false,
  optional_taxes jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_services" ON public.sameday_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read sameday_services" ON public.sameday_services
  FOR SELECT TO authenticated USING (true);

-- Sameday Counties
CREATE TABLE public.sameday_counties (
  id int PRIMARY KEY,
  name text NOT NULL,
  code text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_counties" ON public.sameday_counties
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read sameday_counties" ON public.sameday_counties
  FOR SELECT TO authenticated USING (true);

-- Sameday Cities
CREATE TABLE public.sameday_cities (
  id int PRIMARY KEY,
  name text NOT NULL,
  county_id int,
  county_name text,
  postal_code text,
  extra_km numeric(8,2),
  village text,
  sameday_delivery_agency text,
  sameday_pickup_agency text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_cities" ON public.sameday_cities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read sameday_cities" ON public.sameday_cities
  FOR SELECT TO authenticated USING (true);

-- Sameday AWBs
CREATE TABLE public.sameday_awbs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  awb_number text UNIQUE,
  parcel_numbers jsonb DEFAULT '[]'::jsonb,
  pickup_point_id int,
  service_id int,
  package_type int NOT NULL DEFAULT 2,
  package_count int NOT NULL DEFAULT 1,
  total_weight numeric(8,2) NOT NULL DEFAULT 1.00,
  cash_on_delivery numeric(12,2) NOT NULL DEFAULT 0,
  insured_value numeric(12,2) NOT NULL DEFAULT 0,
  awb_payment int NOT NULL DEFAULT 1,
  third_party_pickup boolean NOT NULL DEFAULT false,
  recipient_name text,
  recipient_phone text,
  recipient_address text,
  recipient_county text,
  recipient_city text,
  status text NOT NULL DEFAULT 'generated',
  pdf_cached_path text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_awbs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_awbs" ON public.sameday_awbs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own sameday_awbs" ON public.sameday_awbs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = sameday_awbs.order_id AND o.user_id = auth.uid())
  );

-- Sameday City Mappings
CREATE TABLE public.sameday_city_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_city_name text NOT NULL,
  platform_county_name text,
  sameday_city_id int,
  sameday_county_id int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sameday_city_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sameday_city_mappings" ON public.sameday_city_mappings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
