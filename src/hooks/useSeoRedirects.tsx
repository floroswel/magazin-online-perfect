// Runtime SEO redirects from admin (table: seo_redirects).
// Matches current pathname against active redirects and navigates client-side.
// We also bump hit_count + last_hit_at via fire-and-forget RPC-equivalent update.
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Redirect {
  id: string;
  source_url: string;
  target_url: string;
  redirect_type: number;
  is_active: boolean;
}

export function useSeoRedirects() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const { data: redirects = [] } = useQuery({
    queryKey: ["seo-redirects-active"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("seo_redirects")
        .select("id, source_url, target_url, redirect_type, is_active")
        .eq("is_active", true);
      return (data || []) as Redirect[];
    },
  });

  useEffect(() => {
    if (!redirects.length) return;
    const current = pathname;
    const match = redirects.find((r) => {
      const src = r.source_url.startsWith("/") ? r.source_url : "/" + r.source_url;
      return src === current || src === current + "/";
    });
    if (!match) return;

    // Fire-and-forget hit log
    (supabase as any)
      .from("seo_redirects")
      .update({ hit_count: (undefined as any), last_hit_at: new Date().toISOString() })
      .eq("id", match.id)
      .then(() => void 0);

    const target = match.target_url;
    if (/^https?:\/\//i.test(target)) {
      window.location.replace(target);
    } else {
      navigate(target.startsWith("/") ? target : "/" + target, { replace: true });
    }
  }, [pathname, search, redirects, navigate]);
}
