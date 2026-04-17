// Stub minim — formă permisivă pentru panoul de admin.
// Logica de storefront a fost ștearsă; aceste valori sunt doar pentru tipuri.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EditableContent = Record<string, any>;

export const EDITABLE_DEFAULTS: EditableContent = {
  announcement: { text: "Livrare gratuită peste 200 lei", bg_color: "#141414", text_color: "#F8F5EF", enabled: true, visible: true },
  header_topbar: { phone: "+40 743 326 405", email: "contact@mamalucica.ro", schedule: "L-V 9-17", shipping_text: "", location: "", visible: true },
  header_nav: [],
  mobile_categories: [],
  why_section: { title: "De ce Mama Lucica", subtitle: "", items: [], visible: true },
  process_section: { title: "Procesul nostru", steps: [], visible: true },
  scent_promos: { title: "Parfumuri", items: [], visible: true },
  trust_strip: [],
  social_proof_static: [],
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
