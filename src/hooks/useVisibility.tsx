// Stub minim — folosit doar de panoul de admin pentru a afișa statistici de vizibilitate.
// Storefront-ul a fost reconstruit; vizibilitatea reală e gestionată în noul flow.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAllVisibility() {
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("site_visibility_settings")
        .select("is_visible");
      const rows = data ?? [];
      setTotal(rows.length);
      setActive(rows.filter((r: any) => r.is_visible).length);
      setInitialized(true);
    })();
  }, []);

  return { active, total, initialized };
}

export function useVisibility(_key: string, fallback = true) {
  return fallback;
}
