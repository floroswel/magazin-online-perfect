
UPDATE app_settings
SET value_json = jsonb_set(
  jsonb_set(value_json, '{meta_pixel}', '{"id": "1697484205020554", "active": true}'::jsonb),
  '{tiktok_pixel}', '{"id": "", "active": false}'::jsonb
),
updated_at = now()
WHERE key = 'pixel_tracking';

UPDATE app_settings
SET value_json = value_json || '{"meta_pixel": {"active": true, "pixel_id": "1697484205020554"}, "tiktok_pixel": {"active": false, "pixel_id": ""}}'::jsonb,
updated_at = now()
WHERE key = 'marketing_integrations';
