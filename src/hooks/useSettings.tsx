import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SettingsMap = Record<string, string>;

const SettingsContext = createContext<SettingsMap>({});

// All the app_settings keys we load for the storefront
const SETTINGS_KEYS = [
  "free_shipping_threshold", "default_shipping_cost", "ramburs_extra_cost",
  "company_iban", "company_bank", "company_name",
  "logo_url", "logo_visible", "site_name", "site_tagline",
  "social_facebook", "social_instagram", "social_tiktok", "social_youtube",
  "footer_col1_title", "footer_col1_links", "footer_col2_title", "footer_col2_links",
  "contact_phone", "contact_email", "contact_address", "contact_schedule",
  "copyright_text", "anpc_display", "footer_upper_bg", "footer_lower_bg",
  "nav_links", "trust_badges", "trust_strip_color", "ticker_text",
  "show_hero", "show_flash_deals", "show_categories", "show_promo_banners",
  "show_featured", "show_trust", "show_new_arrivals", "show_recently_viewed", "show_newsletter",
  "low_stock_threshold", "nav_bar_color", "header_bg",
  "bestsellers_title", "new_arrivals_title",
  "newsletter_title", "newsletter_subtitle", "newsletter_bg",
  "delivery_time", "return_days", "delivery_description",
  "reviews_enabled", "catalog_items_per_page", "catalog_default_sort",
  "robots_txt", "loyalty_enabled",
];

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({});

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", SETTINGS_KEYS);

    if (!data) return;
    const map: SettingsMap = {};
    data.forEach((row: any) => {
      const val = row.value_json;
      // Unwrap JSON strings — stored as '"value"' in DB
      map[row.key] = typeof val === "string" ? val : JSON.stringify(val);
    });
    setSettings(map);
  }, []);

  useEffect(() => {
    fetchSettings();
    const channel = supabase
      .channel("settings-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "app_settings",
      }, (payload: any) => {
        const newRow = payload.new;
        if (newRow?.key && SETTINGS_KEYS.includes(newRow.key)) {
          // Incremental update instead of full refetch
          setSettings(prev => {
            const val = newRow.value_json;
            const parsed = typeof val === "string" ? val : JSON.stringify(val);
            return { ...prev, [newRow.key]: parsed };
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsMap {
  return useContext(SettingsContext);
}
