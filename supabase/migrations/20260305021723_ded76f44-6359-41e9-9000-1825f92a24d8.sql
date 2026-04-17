
-- Add columns to existing returns table for enhanced return system
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'return';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS customer_id uuid;

-- Create return_request_items table
CREATE TABLE IF NOT EXISTS public.return_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  order_item_id uuid,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  exchange_product_id uuid REFERENCES public.products(id),
  exchange_variant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.return_request_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for return_request_items
CREATE POLICY "Users can view own return items" ON public.return_request_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.returns r WHERE r.id = return_request_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own return items" ON public.return_request_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.returns r WHERE r.id = return_request_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage return items" ON public.return_request_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for return photos
INSERT INTO storage.buckets (id, name, public) VALUES ('return-photos', 'return-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for return photos
CREATE POLICY "Users can upload return photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'return-photos');

CREATE POLICY "Anyone can view return photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'return-photos');

CREATE POLICY "Admins can delete return photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'return-photos' AND public.has_role(auth.uid(), 'admin'));
