UPDATE app_settings SET value_json = to_jsonb(v::text) FROM (VALUES
  ('footer_bg_color','#1F3A2A'),
  ('footer_lower_bg','#152818'),
  ('footer_bottom_bg_color','#152818'),
  ('footer_upper_bg','#1F3A2A'),
  ('footer_text_color','#E8F0EA'),
  ('footer_title_color','#FFFFFF'),
  ('footer_link_color','#B8CFC0'),
  ('text_color','#1F2937'),
  ('secondary_color','#1F3A2A')
) AS new_vals(k,v) WHERE app_settings.key = new_vals.k;