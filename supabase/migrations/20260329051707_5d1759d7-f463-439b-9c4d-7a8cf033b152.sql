INSERT INTO public.app_settings (key, value_json, description)
VALUES ('email_settings', '{"from_email": "no-reply@mamalucica.ro", "from_name": "VENTUZA"}'::jsonb, 'Email sender configuration')
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = now();