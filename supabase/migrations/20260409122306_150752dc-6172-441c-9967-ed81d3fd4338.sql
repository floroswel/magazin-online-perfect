
-- Create a secure function to serve scripts without exposing raw content via RLS
-- This returns only the necessary data for script injection
CREATE OR REPLACE FUNCTION public.get_active_scripts_for_page(p_page_types text[])
RETURNS TABLE (
  id uuid,
  script_type text,
  inline_content text,
  external_url text,
  external_async boolean,
  external_defer boolean,
  external_type text,
  external_crossorigin text,
  external_custom_attributes jsonb,
  location text,
  pages jsonb,
  sort_order integer,
  content text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    cs.id, cs.script_type, cs.inline_content, cs.external_url,
    cs.external_async, cs.external_defer, cs.external_type,
    cs.external_crossorigin, cs.external_custom_attributes,
    cs.location, cs.pages, cs.sort_order, cs.content
  FROM public.custom_scripts cs
  WHERE cs.is_active = true
    AND (
      cs.pages IS NULL 
      OR cs.pages = '[]'::jsonb
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(cs.pages) page_val
        WHERE page_val = ANY(p_page_types)
      )
    )
  ORDER BY cs.sort_order;
$$;
