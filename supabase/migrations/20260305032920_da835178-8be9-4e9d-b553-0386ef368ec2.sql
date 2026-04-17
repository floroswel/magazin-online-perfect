
-- Add photos column to product_reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Add review_request_sent and review_request_sent_at to orders for tracking email sequence
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_request_sent boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_request_sent_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_reminder_sent boolean DEFAULT false;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos-uploads', 'review-photos-uploads', true) ON CONFLICT DO NOTHING;

-- Storage policy for review photo uploads
CREATE POLICY "Anyone can upload review photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-photos-uploads');
CREATE POLICY "Anyone can view review photos" ON storage.objects FOR SELECT USING (bucket_id = 'review-photos-uploads');
