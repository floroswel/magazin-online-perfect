
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";

interface CustomScript {
  id: string;
  script_type: string;
  inline_content: string | null;
  external_url: string | null;
  external_async: boolean;
  external_defer: boolean;
  external_type: string;
  external_crossorigin: string | null;
  external_custom_attributes: any;
  location: string;
  pages: string[];
  is_active: boolean;
  sort_order: number;
  /* legacy */
  content?: string;
}

/** Map route path to page type */
function getPageTypes(pathname: string): string[] {
  const types: string[] = ["all_pages"];
  if (pathname === "/" || pathname === "") types.push("homepage");
  if (/^\/(produs|product)\//.test(pathname)) types.push("product");
  if (/^\/(categorie|category|catalog)/.test(pathname)) types.push("category");
  if (/^\/(cos|cart)$/.test(pathname)) types.push("cart");
  if (/^\/checkout$/.test(pathname)) types.push("checkout");
  if (/^\/(order-confirmation|confirmare)/.test(pathname)) types.push("after_checkout");
  if (/^\/(auth|login|register|autentificare)/.test(pathname)) types.push("auth");
  if (/^\/(account|cont)/.test(pathname)) types.push("account");
  if (/^\/(search|cautare|cauta)/.test(pathname)) types.push("search");
  if (/^\/(blog|articol)/.test(pathname)) types.push("blog");
  if (/^\/(page|pagina|politica|termeni|contact)/.test(pathname)) types.push("static");
  return types;
}

export default function CustomScriptInjector() {
  const [scripts, setScripts] = useState<CustomScript[]>([]);
  const location = useLocation();

  useEffect(() => {
    (supabase
      .from("custom_scripts")
      .select("id, script_type, inline_content, external_url, external_async, external_defer, external_type, external_crossorigin, external_custom_attributes, location, pages, is_active, sort_order, content")
      .eq("is_active", true)
      .order("sort_order") as any)
      .then(({ data }: any) => setScripts(data || []));
  }, []);

  useEffect(() => {
    if (scripts.length === 0) return;

    const pageTypes = getPageTypes(location.pathname);

    const applicable = scripts.filter(s => {
      const pages: string[] = Array.isArray(s.pages) ? s.pages : ["all_pages"];
      return pages.some(p => pageTypes.includes(p));
    });

    const injected: HTMLElement[] = [];

    applicable.forEach(s => {
      const target =
        s.location === "header" ? document.head :
        s.location === "body" ? document.body :
        document.body; // footer = end of body

      if (s.script_type === "external" && s.external_url) {
        const el = document.createElement("script");
        el.setAttribute("data-custom-script", s.id);
        el.src = s.external_url.trim();
        if (s.external_async) el.async = true;
        if (s.external_defer) el.defer = true;
        if (s.external_type) el.type = s.external_type;
        if (s.external_crossorigin) el.crossOrigin = s.external_crossorigin;
        // custom attributes
        if (s.external_custom_attributes && typeof s.external_custom_attributes === "object") {
          const attrs = Array.isArray(s.external_custom_attributes) ? s.external_custom_attributes : [];
          attrs.forEach((attr: any) => {
            if (attr.key) el.setAttribute(attr.key, attr.value || "");
          });
        }
        target.appendChild(el);
        injected.push(el);
      } else {
        // inline - raw injection
        const code = s.inline_content || s.content || "";
        if (!code.trim()) return;

        // If it contains <script> or <style> or HTML, use a wrapper
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-custom-script", s.id);
        wrapper.style.display = "none";
        // We need to parse and inject scripts properly
        target.appendChild(wrapper);
        injected.push(wrapper);

        // Use a range + createContextualFragment to execute <script> tags
        const range = document.createRange();
        range.setStart(wrapper, 0);
        const frag = range.createContextualFragment(code);
        wrapper.replaceWith(frag);
        // Since replaceWith removes wrapper, track differently
        // We'll use a marker comment
        const marker = document.createComment(`custom-script-${s.id}`);
        target.appendChild(marker);
        // Replace wrapper in injected with a cleanup element
        injected[injected.length - 1] = marker as any;
      }
    });

    return () => {
      injected.forEach(el => {
        try { el.remove?.(); } catch {}
      });
      // Also clean up any leftover elements by data attribute
      document.querySelectorAll("[data-custom-script]").forEach(el => el.remove());
    };
  }, [scripts, location.pathname]);

  return null;
}
