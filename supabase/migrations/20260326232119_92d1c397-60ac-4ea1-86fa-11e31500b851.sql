
-- 360 Slider global settings
CREATE TABLE public.slider_360_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  auto_rotate_default boolean NOT NULL DEFAULT false,
  rotation_speed_default int NOT NULL DEFAULT 5,
  default_frame_count int NOT NULL DEFAULT 36,
  show_360_badge boolean NOT NULL DEFAULT true,
  show_controls boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slider_360_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage slider_360_settings" ON public.slider_360_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read slider_360_settings" ON public.slider_360_settings
  FOR SELECT USING (true);
INSERT INTO public.slider_360_settings (id) VALUES (gen_random_uuid());

-- Product 360 sliders
CREATE TABLE public.product_360_sliders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  frame_count int NOT NULL DEFAULT 0,
  auto_rotate boolean,
  rotation_speed int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_360_sliders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_360_sliders" ON public.product_360_sliders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read product_360_sliders" ON public.product_360_sliders
  FOR SELECT USING (true);

-- Product 360 frames
CREATE TABLE public.product_360_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_id uuid REFERENCES public.product_360_sliders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  frame_number int NOT NULL DEFAULT 1,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_size int NOT NULL DEFAULT 0,
  width int,
  height int,
  original_filename text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_360_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_360_frames" ON public.product_360_frames
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read product_360_frames" ON public.product_360_frames
  FOR SELECT USING (true);

-- Storage bucket for 360 slider images
INSERT INTO storage.buckets (id, name, public) VALUES ('360-sliders', '360-sliders', true);

CREATE POLICY "Anyone can read 360 slider images" ON storage.objects
  FOR SELECT USING (bucket_id = '360-sliders');
CREATE POLICY "Admins can upload 360 slider images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = '360-sliders' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete 360 slider images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = '360-sliders' AND public.has_role(auth.uid(), 'admin'));
