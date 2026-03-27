import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";

interface SeoSettings {
  site_title: string;
  site_description: string;
  og_image: string;
  google_verification: string;
  bing_verification: string;
  canonical_url: string;
  meta_title_template: string;
  ga_id: string;
}

const defaults: SeoSettings = {
  site_title: "VENTUZA",
  site_description: "",
  og_image: "/pwa-512x512.png",
  google_verification: "",
  bing_verification: "",
  canonical_url: "",
  meta_title_template: "{product_name} | {store_name}",
  ga_id: "",
};

let cachedSettings: SeoSettings | null = null;

export function useSeoSettings() {
  const [settings, setSettings] = useState<SeoSettings>(cachedSettings || defaults);

  useEffect(() => {
    if (cachedSettings) return;
    supabase.from("app_settings").select("value_json").eq("key", "seo_settings").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          const s = { ...defaults, ...(data.value_json as any) };
          cachedSettings = s;
          setSettings(s);
        }
      });
  }, []);

  return settings;
}

/**
 * Inject SEO verification meta tags + Organization JSON-LD on all pages.
 * Called once from Layout.
 */
export default function SeoHead() {
  const seo = useSeoSettings();
  const location = useLocation();

  useEffect(() => {
    // Google verification
    let gMeta = document.querySelector('meta[name="google-site-verification"]');
    if (seo.google_verification) {
      if (!gMeta) { gMeta = document.createElement("meta"); gMeta.setAttribute("name", "google-site-verification"); document.head.appendChild(gMeta); }
      gMeta.setAttribute("content", seo.google_verification);
    }

    // Bing verification
    let bMeta = document.querySelector('meta[name="msvalidate.01"]');
    if (seo.bing_verification) {
      if (!bMeta) { bMeta = document.createElement("meta"); bMeta.setAttribute("name", "msvalidate.01"); document.head.appendChild(bMeta); }
      bMeta.setAttribute("content", seo.bing_verification);
    }

    // Canonical
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    const base = seo.canonical_url || window.location.origin;
    canon.href = base + location.pathname;
  }, [seo, location.pathname]);

  // Organization JSON-LD (all pages)
  const orgSchema = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.site_title || "MegaShop",
    url: seo.canonical_url || window.location.origin,
    logo: (seo.canonical_url || window.location.origin) + "/pwa-512x512.png",
  });

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgSchema }} />
  );
}
