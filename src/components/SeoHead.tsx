import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { useEditableContent } from "@/hooks/useEditableContent";

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
  site_title: "MamaLucica",
  site_description: "Descoperă lumânări artizanale create din ingrediente naturale, parfumuri rare și cere de soia. Livrare în 24-48h.",
  og_image: "/og-homepage.jpg",
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

function setMeta(nameOrProp: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canon) {
    canon = document.createElement("link");
    canon.rel = "canonical";
    document.head.appendChild(canon);
  }
  canon.href = href;
}

export interface PageSeoData {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  productPrice?: number;
  productCurrency?: string;
  noindex?: boolean;
  canonicalOverride?: string;
}

/**
 * Call from any page to set dynamic SEO meta.
 */
export function usePageSeo(data: PageSeoData) {
  const seo = useSeoSettings();
  const location = useLocation();

  useEffect(() => {
    const base = seo.canonical_url || window.location.origin;

    // Title
    if (data.title) document.title = data.title;

    // Description
    if (data.description) setMeta("description", data.description);

    // OG tags
    setMeta("og:title", data.title || document.title, "property");
    setMeta("og:description", data.description || seo.site_description, "property");
    setMeta("og:type", data.ogType || "website", "property");
    setMeta("og:image", data.ogImage || seo.og_image || "/og-homepage.jpg", "property");
    setMeta("og:url", base + location.pathname, "property");
    setMeta("og:site_name", "MamaLucica", "property");
    setMeta("og:locale", "ro_RO", "property");

    // Product-specific OG
    if (data.productPrice != null) {
      setMeta("product:price:amount", String(data.productPrice), "property");
      setMeta("product:price:currency", data.productCurrency || "RON", "property");
    }

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", data.title || document.title);
    setMeta("twitter:description", data.description || seo.site_description);
    setMeta("twitter:image", data.ogImage || seo.og_image || "/og-homepage.jpg");

    // Canonical - catalog with filters should point to base /catalog
    const canonPath = data.canonicalOverride || (location.pathname === "/catalog" ? "/catalog" : location.pathname);
    setCanonical(base + canonPath);

    // Noindex
    if (data.noindex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }
  }, [data.title, data.description, data.ogImage, data.ogType, data.productPrice, location.pathname, seo]);
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
    if (seo.google_verification) {
      setMeta("google-site-verification", seo.google_verification);
    }
    // Bing verification
    if (seo.bing_verification) {
      setMeta("msvalidate.01", seo.bing_verification);
    }

    // Default canonical (pages using usePageSeo will override)
    const base = seo.canonical_url || window.location.origin;
    setCanonical(base + location.pathname);
  }, [seo, location.pathname]);

  // Organization JSON-LD (all pages)
  const base = seo.canonical_url || window.location.origin;
  const orgSchema = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MamaLucica SRL",
    url: base,
    logo: base + "/og-homepage.jpg",
    sameAs: [
      "https://www.tiktok.com/@mamalucica",
      "https://www.instagram.com/mamalucica.ro",
      "https://www.facebook.com/mamalucica.ro"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@mamalucica.ro",
      contactType: "customer service",
      availableLanguage: "Romanian"
    }
  });

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgSchema }} />
  );
}
