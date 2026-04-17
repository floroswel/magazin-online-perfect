
-- Allow anonymous/non-auth users to read app_settings (for footer, etc.)
CREATE POLICY "Public can view settings"
ON public.app_settings
FOR SELECT
USING (true);
