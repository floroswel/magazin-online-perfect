ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS care_guide_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS tracking_email_sent_at timestamptz;