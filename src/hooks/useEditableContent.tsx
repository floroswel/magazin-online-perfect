// Stub minim — păstrează tipurile și valorile implicite pentru panoul de admin.
// Conținutul editabil al storefront-ului va fi gestionat prin app_settings standard.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EditableContent {
  announcement: { text: string; bg_color: string; text_color: string; visible: boolean };
  header_topbar: { phone: string; email: string; schedule: string; visible: boolean };
  header_nav: { links: Array<{ label: string; url: string }>; visible: boolean };
  mobile_categories: { items: Array<{ label: string; icon: string; url: string }>; visible: boolean };
  why_section: { title: string; subtitle: string; items: Array<{ title: string; text: string; icon: string }>; visible: boolean };
  process_section: { title: string; steps: Array<{ title: string; text: string }>; visible: boolean };
  scent_promos: { title: string; items: Array<{ name: string; image: string; url: string }>; visible: boolean };
  trust_strip: { items: Array<{ title: string; text: string; icon: string }>; visible: boolean };
  social_proof_static: { messages: string[]; visible: boolean };
}

export const EDITABLE_DEFAULTS: EditableContent = {
  announcement: { text: "Livrare gratuită peste 200 lei", bg_color: "#141414", text_color: "#F8F5EF", visible: true },
  header_topbar: { phone: "+40 743 326 405", email: "contact@mamalucica.ro", schedule: "L-V 9-17", visible: true },
  header_nav: { links: [], visible: true },
  mobile_categories: { items: [], visible: true },
  why_section: { title: "De ce Mama Lucica", subtitle: "", items: [], visible: true },
  process_section: { title: "Procesul nostru", steps: [], visible: true },
  scent_promos: { title: "Parfumuri", items: [], visible: true },
  trust_strip: { items: [], visible: true },
  social_proof_static: { messages: [], visible: true },
};

export function useEditableContent(): EditableContent & { loading: boolean } {
  const [content, setContent] = useState<EditableContent>(EDITABLE_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const keys = Object.keys(EDITABLE_DEFAULTS).map((k) => `editable_${k}`);
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", keys);
      const merged: any = { ...EDITABLE_DEFAULTS };
      (data ?? []).forEach((row: any) => {
        const shortKey = row.key.replace(/^editable_/, "");
        if (shortKey in merged) {
          try {
            merged[shortKey] = typeof row.value_json === "string"
              ? JSON.parse(row.value_json)
              : row.value_json;
          } catch { /* ignore */ }
        }
      });
      setContent(merged);
      setLoading(false);
    })();
  }, []);

  return { ...content, loading };
}
