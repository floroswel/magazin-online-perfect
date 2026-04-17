-- CRITICAL FIX 2: Remove unnecessary tables from realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_visibility_settings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.site_visibility_settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_banners') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.site_banners;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_layout_settings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.site_layout_settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_settings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.site_settings;
  END IF;
END $$;