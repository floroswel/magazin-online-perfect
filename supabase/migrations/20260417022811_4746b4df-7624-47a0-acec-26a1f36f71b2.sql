-- ========================================
-- SECURITY HARDENING — Mama Lucica
-- ========================================

-- 1. ELIMINĂ coloanele plain-text cu credențiale
ALTER TABLE public.mokka_settings DROP COLUMN IF EXISTS secret_key;
ALTER TABLE public.tbi_settings DROP COLUMN IF EXISTS password, DROP COLUMN IF EXISTS sftl_public_key, DROP COLUMN IF EXISTS merchant_public_key;
ALTER TABLE public.paypo_settings DROP COLUMN IF EXISTS client_secret;
ALTER TABLE public.smartbill_settings DROP COLUMN IF EXISTS token;
ALTER TABLE public.sameday_settings DROP COLUMN IF EXISTS password, DROP COLUMN IF EXISTS auth_token;
ALTER TABLE public.erp_integrations DROP COLUMN IF EXISTS api_key;
ALTER TABLE public.erp_webhooks DROP COLUMN IF EXISTS secret_key;

-- 2. RESTRICȚIONEAZĂ listing pe storage buckets publice
-- Drop policies existente prea permisive
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname ILIKE '%public%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Re-creează policies: SELECT pe obiecte specifice (nu LIST), nu pe bucket entire
CREATE POLICY "Public read product-images by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images' AND name IS NOT NULL);

CREATE POLICY "Public read review-photos by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'review-photos-uploads' AND name IS NOT NULL);

CREATE POLICY "Public read affiliate-materials by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'affiliate-materials' AND name IS NOT NULL);

CREATE POLICY "Public read customization-uploads by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'customization-uploads' AND name IS NOT NULL);

CREATE POLICY "Public read 360-sliders by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = '360-sliders' AND name IS NOT NULL);

CREATE POLICY "Public read product-videos by name"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-videos' AND name IS NOT NULL);

-- Admin upload/delete pe buckets publice
CREATE POLICY "Admins write public buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('product-images','review-photos-uploads','affiliate-materials','customization-uploads','360-sliders','product-videos')
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins update public buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('product-images','review-photos-uploads','affiliate-materials','customization-uploads','360-sliders','product-videos')
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins delete public buckets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('product-images','review-photos-uploads','affiliate-materials','customization-uploads','360-sliders','product-videos')
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
