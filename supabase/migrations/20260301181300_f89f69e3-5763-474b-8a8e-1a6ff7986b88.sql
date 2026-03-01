-- Add placement column to cms_pages for controlling where the page appears
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'footer_info';

-- Possible values: footer_info, footer_help, header_nav, none
COMMENT ON COLUMN public.cms_pages.placement IS 'Where the page link appears: footer_info, footer_help, header_nav, none';