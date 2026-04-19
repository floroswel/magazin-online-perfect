-- Restrict public LIST/SELECT on storage.objects for these public buckets.
-- Files remain accessible via direct public URL (CDN serves them),
-- but anonymous clients can no longer enumerate the bucket via supabase.storage.list().
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND cmd='SELECT'
      AND (qual LIKE '%review-photos-uploads%'
        OR qual LIKE '%affiliate-materials%'
        OR qual LIKE '%customization-uploads%'
        OR qual LIKE '%360-sliders%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Allow only authenticated users (or owners) to LIST these bucket contents.
-- Public CDN reads via direct URL still work because the CDN doesn't go through RLS.
CREATE POLICY "Authenticated can list review photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-photos-uploads');

CREATE POLICY "Authenticated can list affiliate materials"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'affiliate-materials');

CREATE POLICY "Owners can list their customization uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'customization-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated can list 360 slider files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = '360-sliders');