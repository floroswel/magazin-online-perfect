-- Ensure site_name is Mama Lucica
INSERT INTO public.app_settings (key, value_json, updated_at)
VALUES 
  ('site_name', '"Mama Lucica"'::jsonb, now()),
  ('site_tagline', '"Lumânări Artizanale"'::jsonb, now())
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = now();

-- Update any other settings that still contain LUMAX
UPDATE public.app_settings 
SET value_json = replace(value_json::text, 'LUMAX', 'Mama Lucica')::jsonb, updated_at = now()
WHERE value_json::text ILIKE '%LUMAX%';
