import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const COOKIE_KEY = "aff_ref";
const DEFAULT_DAYS = 30;

export function useAffiliateTracking() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // Store affiliate code in cookie (last-click attribution)
    const days = DEFAULT_DAYS;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(ref)}; expires=${expires}; path=/; SameSite=Lax`;

    // Track click
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("affiliates").select("id").eq("affiliate_code", ref).maybeSingle().then(({ data }) => {
        if (data) {
          supabase.from("affiliate_clicks").insert({
            affiliate_id: data.id,
            ip_address: null,
            landing_url: window.location.href,
            referrer_url: document.referrer || null,
          }).then(() => {
            supabase.from("affiliates").update({
              total_clicks: (undefined as any), // We'll use rpc or just increment
            }).eq("id", data.id);
            // Simple increment via raw update
            supabase.rpc("increment_affiliate_clicks" as any, { aff_id: data.id }).catch(() => {
              // Fallback: just record the click, don't worry about counter
            });
          });
        }
      });
    });
  }, [searchParams]);
}

export function getAffiliateCode(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
