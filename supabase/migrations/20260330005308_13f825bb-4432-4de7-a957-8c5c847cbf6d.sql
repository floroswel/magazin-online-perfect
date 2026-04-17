
-- Fix custom_404_stats view: switch to SECURITY INVOKER
DROP VIEW IF EXISTS public.custom_404_stats;
CREATE VIEW public.custom_404_stats
  WITH (security_invoker = on)
AS
SELECT url_accessed,
    count(*)::integer AS visit_count,
    min(accessed_at) AS first_seen,
    max(accessed_at) AS last_seen,
    count(DISTINCT referrer)::integer AS referrer_count
FROM custom_404_log
GROUP BY url_accessed
ORDER BY count(*) DESC;
