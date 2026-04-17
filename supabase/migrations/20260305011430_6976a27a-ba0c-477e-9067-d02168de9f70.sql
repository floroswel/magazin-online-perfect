-- Add courier tracking fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_generated_at timestamptz;

-- Create tracking events table
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  description text,
  location text,
  courier text,
  event_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tracking events"
  ON public.tracking_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can manage tracking events"
  ON public.tracking_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);