import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SettingsMap = Record<string, string>;

interface SettingsContextValue {
  settings: SettingsMap;
  updateSetting: (key: string, value: string) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: {},
  updateSetting: async () => false,
});

// All the app_settings keys we load for the storefront
const SETTINGS_KEYS = [
  // Shipping & pricing
  "free_shipping_threshold", "default_shipping_cost", "ramburs_extra_cost",
  // Company
  "company_iban", "company_bank", "company_name",
  // Branding
  "logo_url", "logo_visible", "site_name", "site_tagline", "favicon_url",
  // Social
  "social_facebook", "social_instagram", "social_tiktok", "social_youtube",
  // Footer
  "footer_col1_title", "footer_col1_links", "footer_col2_title", "footer_col2_links",
  "contact_phone", "contact_email", "contact_address", "contact_schedule",
  "copyright_text", "anpc_display", "footer_upper_bg", "footer_lower_bg",
  // Navigation
  "nav_links", "trust_badges", "trust_strip_color", "ticker_text",
  // Homepage toggles
  "show_hero", "show_flash_deals", "show_categories", "show_promo_banners",
  "show_featured", "show_trust", "show_new_arrivals", "show_recently_viewed", "show_newsletter",
  // Misc
  "low_stock_threshold", "nav_bar_color", "header_bg",
  "bestsellers_title", "new_arrivals_title",
  "newsletter_title", "newsletter_subtitle", "newsletter_bg",
  "delivery_time", "return_days", "delivery_description",
  "reviews_enabled", "catalog_items_per_page", "catalog_default_sort",
  "robots_txt", "loyalty_enabled",
  // ━━ Theme colors ━━
  "primary_color", "secondary_color", "accent_color",
  "background_color", "text_color",
  // ━━ Button styling ━━
  "btn_primary_bg", "btn_primary_text", "btn_primary_hover",
  "btn_border_radius", "cta_bg", "cta_text",
  // ━━ Typography ━━
  "heading_font", "body_font", "heading_size", "font_size_scale",
  // ━━ Section / bar colors ━━
  "announcement_bg", "announcement_text_color",
  // ━━ Custom CSS ━━
  "custom_css",
  // ━━ Trust icons ━━
  "trust_icons",
  // ━━ Product & catalog colors ━━
  "product_price_color", "product_stars_color", "badge_sale_color",
  "badge_new_color", "free_shipping_color", "savings_color",
];

/* ── Convert a hex color (#RRGGBB) to the HSL string Shadcn expects ("H S% L%") ── */
function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function isLightHSL(hsl: string): boolean {
  const parts = hsl.replace(/%/g, "").trim().split(/\s+/);
  if (parts.length < 3) return false;
  return parseFloat(parts[2]) >= 55;
}

/* ── Apply settings as CSS custom properties so the whole storefront reacts ── */
function applyCSSVariables(s: SettingsMap) {
  const root = document.documentElement;

  // ━━ Brand Colors → HSL for Shadcn ━━
  if (s.primary_color) {
    const hsl = hexToHSL(s.primary_color);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--primary-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
    }
    root.style.setProperty("--lumax-blue", s.primary_color);
  }
  if (s.secondary_color) {
    const hsl = hexToHSL(s.secondary_color);
    if (hsl) {
      root.style.setProperty("--secondary", hsl);
      root.style.setProperty("--secondary-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
    }
    root.style.setProperty("--lumax-dark", s.secondary_color);
  }
  if (s.accent_color) {
    const hsl = hexToHSL(s.accent_color);
    if (hsl) {
      root.style.setProperty("--destructive", hsl);
      root.style.setProperty("--destructive-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
    }
    root.style.setProperty("--lumax-red", s.accent_color);
  }
  if (s.background_color) {
    const hsl = hexToHSL(s.background_color);
    if (hsl) {
      root.style.setProperty("--background", hsl);
    }
  }
  if (s.text_color) {
    const hsl = hexToHSL(s.text_color);
    if (hsl) {
      root.style.setProperty("--foreground", hsl);
      root.style.setProperty("--card-foreground", hsl);
    }
    root.style.setProperty("--lumax-text", s.text_color);
  }

  // ━━ Buttons ━━
  if (s.btn_primary_bg) root.style.setProperty("--btn-primary-bg", s.btn_primary_bg);
  if (s.btn_primary_text) root.style.setProperty("--btn-primary-text", s.btn_primary_text);
  if (s.btn_primary_hover) root.style.setProperty("--btn-primary-hover", s.btn_primary_hover);
  if (s.btn_border_radius) root.style.setProperty("--radius", `${parseInt(s.btn_border_radius) / 16}rem`);
  if (s.cta_bg) root.style.setProperty("--cta-bg", s.cta_bg);
  if (s.cta_text) root.style.setProperty("--cta-text", s.cta_text);

  // ━━ Header & Nav ━━
  if (s.header_bg) root.style.setProperty("--header-bg", s.header_bg);
  if (s.nav_bar_color) {
    root.style.setProperty("--nav-bar-color", s.nav_bar_color);
    root.style.setProperty("--lumax-blue-dark", s.nav_bar_color);
  }
  if (s.announcement_bg) root.style.setProperty("--announcement-bg", s.announcement_bg);
  if (s.announcement_text_color) root.style.setProperty("--announcement-text", s.announcement_text_color);

  // ━━ Footer ━━
  if (s.footer_upper_bg) root.style.setProperty("--footer-upper-bg", s.footer_upper_bg);
  if (s.footer_lower_bg) root.style.setProperty("--footer-lower-bg", s.footer_lower_bg);

  // ━━ Sections ━━
  if (s.trust_strip_color) root.style.setProperty("--trust-strip-color", s.trust_strip_color);
  if (s.newsletter_bg) root.style.setProperty("--newsletter-bg", s.newsletter_bg);

  // ━━ Product & Catalog colors ━━
  root.style.setProperty("--product-price-color", s.product_price_color || "#FF3300");
  root.style.setProperty("--stars-color", s.product_stars_color || "#FFB800");
  root.style.setProperty("--badge-sale-color", s.badge_sale_color || "#FF3300");
  root.style.setProperty("--badge-new-color", s.badge_new_color || "#00A650");
  root.style.setProperty("--free-shipping-color", s.free_shipping_color || "#00A650");
  root.style.setProperty("--savings-color", s.savings_color || "#00A650");

  // ━━ Typography (load Google Fonts + set CSS vars) ━━
  const fontsToLoad = new Set<string>();
  if (s.heading_font && s.heading_font !== "Inter") fontsToLoad.add(s.heading_font);
  if (s.body_font && s.body_font !== "Inter") fontsToLoad.add(s.body_font);
  if (fontsToLoad.size > 0) {
    let fontLink = document.getElementById("settings-google-fonts") as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "settings-google-fonts";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    const families = Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`).join("&");
    fontLink.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }
  if (s.heading_font) root.style.setProperty("--font-heading", `'${s.heading_font}', serif`);
  if (s.body_font) {
    root.style.setProperty("--font-body", `'${s.body_font}', sans-serif`);
    root.style.fontFamily = `'${s.body_font}', system-ui, sans-serif`;
  }
  if (s.font_size_scale) root.style.setProperty("--font-scale", s.font_size_scale);

  // ━━ Custom CSS ━━
  let customEl = document.getElementById("settings-custom-css") as HTMLStyleElement;
  if (s.custom_css) {
    if (!customEl) {
      customEl = document.createElement("style");
      customEl.id = "settings-custom-css";
      document.head.appendChild(customEl);
    }
    customEl.textContent = s.custom_css;
  } else if (customEl) {
    customEl.textContent = "";
  }
}

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
      map[row.key] = typeof val === "string" ? val : JSON.stringify(val);
    });
    setSettings(map);
    applyCSSVariables(map);
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    console.log("updateSetting called:", key, value);

    // Optimistic update — apply CSS immediately
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      applyCSSVariables(updated);
      return updated;
    });

    // Persist to DB
    console.log("Saving to DB...");
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        { key, value_json: value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
      .select("key, value_json");

    console.log("DB result:", { data, error });

    if (error) {
      console.error("SAVE FAILED:", error.message, error.code);
      fetchSettings();
      return false;
    }

    console.log("Saved successfully!");
    return true;
  }, [fetchSettings]);

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
          setSettings(prev => {
            const val = newRow.value_json;
            const parsed = typeof val === "string" ? val : JSON.stringify(val);
            const updated = { ...prev, [newRow.key]: parsed };
            applyCSSVariables(updated);
            return updated;
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
