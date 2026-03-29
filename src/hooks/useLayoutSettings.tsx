import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LayoutSettings {
  product_grid_columns: number;
  product_grid_mobile_columns: number;
  product_card_style: string;
  product_sort_order: string;
  products_per_page: number;
  pagination_style: string;
  header_logo_position: string;
  header_nav_position: string;
  header_sticky: boolean;
  header_height: string;
  header_transparent_hero: boolean;
  header_cta_show: boolean;
  header_cta_text: string;
  header_cta_url: string;
  footer_columns: number;
  footer_sol_anpc_position: string;
  section_alignment: string;
  section_width: string;
}

const DEFAULTS: LayoutSettings = {
  product_grid_columns: 4,
  product_grid_mobile_columns: 2,
  product_card_style: "grid",
  product_sort_order: "default",
  products_per_page: 12,
  pagination_style: "pages",
  header_logo_position: "left",
  header_nav_position: "center",
  header_sticky: true,
  header_height: "normal",
  header_transparent_hero: false,
  header_cta_show: false,
  header_cta_text: "",
  header_cta_url: "",
  footer_columns: 4,
  footer_sol_anpc_position: "inside",
  section_alignment: "center",
  section_width: "contained",
};

let layoutCache: LayoutSettings | null = null;
let layoutListeners: Set<() => void> = new Set();
let layoutInitialized = false;
let layoutInitializing = false;

function notifyLayoutListeners() {
  layoutListeners.forEach((fn) => fn());
}

async function initLayout() {
  if (layoutInitialized || layoutInitializing) return;
  layoutInitializing = true;
  const { data } = await (supabase as any)
    .from("site_layout_settings")
    .select("setting_key, value_json");
  const merged = { ...DEFAULTS };
  if (data) {
    data.forEach((row: any) => {
      if (row.setting_key in merged) {
        const val = row.value_json;
        (merged as any)[row.setting_key] = typeof val === "string" ? val.replace(/^"|"$/g, "") : val;
      }
    });
  }
  // Convert string booleans
  if (typeof merged.header_sticky === "string") merged.header_sticky = merged.header_sticky === "true";
  if (typeof merged.header_transparent_hero === "string") merged.header_transparent_hero = (merged.header_transparent_hero as any) === "true";
  if (typeof merged.header_cta_show === "string") merged.header_cta_show = (merged.header_cta_show as any) === "true";
  
  layoutCache = merged;
  layoutInitialized = true;
  layoutInitializing = false;
  notifyLayoutListeners();

  supabase
    .channel("layout-settings-storefront")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_layout_settings" }, async () => {
      layoutInitialized = false;
      layoutInitializing = false;
      await initLayout();
    })
    .subscribe();
}

export function useLayoutSettings(): LayoutSettings {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    initLayout();
    const listener = () => forceUpdate((n) => n + 1);
    layoutListeners.add(listener);
    return () => { layoutListeners.delete(listener); };
  }, []);

  return layoutCache || DEFAULTS;
}
