
INSERT INTO public.app_settings (key, value_json) VALUES
  ('product_price_color', '"#FF3300"'),
  ('product_stars_color', '"#FFB800"'),
  ('badge_sale_color', '"#FF3300"'),
  ('badge_new_color', '"#00A650"'),
  ('free_shipping_color', '"#00A650"'),
  ('savings_color', '"#00A650"')
ON CONFLICT (key) DO NOTHING;
