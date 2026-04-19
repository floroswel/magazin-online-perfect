// SEO head — unified for storefront pages.
// Canonical falls back to app_settings.site_url (managed in Admin → General Settings),
// then to window.location.origin if missing.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SeoOptions {
  title?: string;
  description?: string;
  noindex?: boolean;
  canonical?: string;
  ogImage?: string;
}

let cachedSiteUrl: string | null = null;

async function getSiteUrl(): Promise<string> {
  if (cachedSiteUrl) return cachedSiteUrl;
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "site_url")
      .maybeSingle();
    const v = (data?.value_json as any);
    const url = (typeof v === "string" ? v : v?.url) || window.location.origin;
    cachedSiteUrl = url.replace(/\/$/, "");
    return cachedSiteUrl;
  } catch {
    return window.location.origin;
  }
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageSeo(opts: SeoOptions = {}) {
  const [siteUrl, setSiteUrl] = useState<string>("");

  useEffect(() => {
    getSiteUrl().then(setSiteUrl);
  }, []);

  useEffect(() => {
    if (opts.title) {
      document.title = opts.title;
      setMeta("og:title", opts.title, "property");
    }
    if (opts.description) {
      const desc = opts.description.slice(0, 160);
      setMeta("description", desc);
      setMeta("og:description", desc, "property");
    }
    setMeta("robots", opts.noindex ? "noindex, nofollow" : "index, follow");

    // Canonical: explicit > computed from siteUrl + path
    const path = window.location.pathname + window.location.search;
    const canonicalHref =
      opts.canonical || (siteUrl ? `${siteUrl}${path}` : `${window.location.origin}${path}`);
    setLink("canonical", canonicalHref);
    setMeta("og:url", canonicalHref, "property");

    if (opts.ogImage) setMeta("og:image", opts.ogImage, "property");
    setMeta("og:type", "website", "property");
  }, [opts.title, opts.description, opts.noindex, opts.canonical, opts.ogImage, siteUrl]);
}

export default function SeoHead(props: SeoOptions) {
  usePageSeo(props);
  return null;
}
