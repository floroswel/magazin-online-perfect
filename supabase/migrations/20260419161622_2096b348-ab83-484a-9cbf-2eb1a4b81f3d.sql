-- 1. Fix RLS "always true" on login_attempts INSERT — only allow valid email shape
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
CREATE POLICY "Anyone can insert login attempts with valid email"
ON public.login_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_valid_email(email));

-- 2. Seed canonical site_url setting (idempotent)
INSERT INTO public.app_settings (key, value_json, description)
VALUES (
  'site_url',
  '"https://your-emag-clone.lovable.app"'::jsonb,
  'Canonical URL used for SEO canonical tags, sitemap.xml, and OG meta. Update in Admin → General Settings when domain changes.'
)
ON CONFLICT (key) DO NOTHING;