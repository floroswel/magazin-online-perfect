DROP FUNCTION IF EXISTS public.get_active_scripts_for_page(text[]);

CREATE FUNCTION public.get_active_scripts_for_page(p_page_types text[])
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
  content text,
  consent_category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cs.id,
    cs.script_type,
    cs.inline_content,
    cs.external_url,
    cs.external_async,
    cs.external_defer,
    cs.external_type,
    cs.external_crossorigin,
    cs.external_custom_attributes,
    cs.location,
    cs.pages,
    cs.sort_order,
    cs.content,
    cs.consent_category
  FROM public.custom_scripts cs
  WHERE cs.is_active = true
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(cs.pages) AS page_type
      WHERE page_type = ANY(p_page_types)
    )
  ORDER BY cs.sort_order ASC;
$$;