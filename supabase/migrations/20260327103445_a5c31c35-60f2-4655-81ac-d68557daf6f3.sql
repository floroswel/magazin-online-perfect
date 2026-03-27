CREATE POLICY "Allow public read active custom scripts"
ON public.custom_scripts
FOR SELECT
TO anon, authenticated
USING (is_active = true);