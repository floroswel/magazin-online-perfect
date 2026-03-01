import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CustomScript {
  id: string;
  content: string;
  script_type: string;
  location: string;
  is_active: boolean;
}

export default function CustomScriptInjector() {
  const [scripts, setScripts] = useState<CustomScript[]>([]);
  const location = useLocation();

  useEffect(() => {
    supabase
      .from("custom_scripts")
      .select("id, content, script_type, location, is_active")
      .eq("is_active", true)
      .then(({ data }) => setScripts(data || []));
  }, []);

  useEffect(() => {
    if (scripts.length === 0) return;

    const isCheckout = location.pathname === "/checkout";
    const isConfirmation = location.pathname === "/order-confirmation";

    const applicable = scripts.filter((s) => {
      switch (s.location) {
        case "all_pages": return true;
        case "header": return true;
        case "body_start": return true;
        case "body_end": return true;
        case "checkout": return isCheckout;
        case "after_checkout": return isConfirmation;
        default: return false;
      }
    });

    const injected: HTMLElement[] = [];

    applicable.forEach((s) => {
      const target =
        s.location === "header" ? document.head : document.body;

      if (s.script_type === "javascript") {
        const el = document.createElement("script");
        el.setAttribute("data-custom-script", s.id);
        el.textContent = s.content;
        target.appendChild(el);
        injected.push(el);
      } else if (s.script_type === "external") {
        const el = document.createElement("script");
        el.setAttribute("data-custom-script", s.id);
        el.src = s.content.trim();
        el.async = true;
        target.appendChild(el);
        injected.push(el);
      } else if (s.script_type === "css") {
        const el = document.createElement("style");
        el.setAttribute("data-custom-script", s.id);
        el.textContent = s.content;
        document.head.appendChild(el);
        injected.push(el);
      } else if (s.script_type === "html") {
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-custom-script", s.id);
        wrapper.innerHTML = s.content;
        if (s.location === "body_start") {
          document.body.insertBefore(wrapper, document.body.firstChild);
        } else {
          document.body.appendChild(wrapper);
        }
        injected.push(wrapper);
      }
    });

    return () => {
      injected.forEach((el) => el.remove());
    };
  }, [scripts, location.pathname]);

  return null;
}
