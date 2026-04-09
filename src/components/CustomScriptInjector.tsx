
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  sort_order: number;
  content?: string;
}

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
    const pageTypes = getPageTypes(location.pathname);
    // Use security definer function instead of direct table access
    (supabase.rpc("get_active_scripts_for_page" as any, { p_page_types: pageTypes }) as any)
      .then(({ data }: any) => setScripts(data || []));
  }, [location.pathname]);

  useEffect(() => {
    if (scripts.length === 0) return;

    const applicable = scripts.filter(s => s.location !== "footer");
    const injected: HTMLElement[] = [];

    applicable.forEach(s => {
      const target =
        s.location === "header" ? document.head :
        document.body;

      if (s.script_type === "external" && s.external_url) {
        const el = document.createElement("script");
        el.setAttribute("data-custom-script", s.id);
        el.src = s.external_url.trim();
        if (s.external_async) el.async = true;
        if (s.external_defer) el.defer = true;
        if (s.external_type) el.type = s.external_type;
        if (s.external_crossorigin) el.crossOrigin = s.external_crossorigin;
        if (s.external_custom_attributes && typeof s.external_custom_attributes === "object") {
          const attrs = Array.isArray(s.external_custom_attributes) ? s.external_custom_attributes : [];
          attrs.forEach((attr: any) => {
            if (attr.key) el.setAttribute(attr.key, attr.value || "");
          });
        }
        target.appendChild(el);
        injected.push(el);
      } else {
        const code = s.inline_content || s.content || "";
        if (!code.trim()) return;

        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-custom-script", s.id);
        wrapper.style.display = "none";
        target.appendChild(wrapper);
        injected.push(wrapper);

        const range = document.createRange();
        range.setStart(wrapper, 0);
        const frag = range.createContextualFragment(code);
        wrapper.replaceWith(frag);
        const marker = document.createComment(`custom-script-${s.id}`);
        target.appendChild(marker);
        injected[injected.length - 1] = marker as any;
      }
    });

    return () => {
      injected.forEach(el => {
        try { el.remove?.(); } catch {}
      });
      document.querySelectorAll("[data-custom-script]").forEach(el => el.remove());
    };
  }, [scripts]);

  return null;
}
