DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE site_theme_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE site_banners; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE site_layout_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;