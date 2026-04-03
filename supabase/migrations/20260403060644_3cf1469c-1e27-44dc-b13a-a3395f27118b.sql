
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product videos" ON storage.objects FOR SELECT USING (bucket_id = 'product-videos');
CREATE POLICY "Authenticated users can upload product videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product videos" ON storage.objects FOR UPDATE USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete product videos" ON storage.objects FOR DELETE USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');
