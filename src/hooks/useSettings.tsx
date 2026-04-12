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
  // Social (legacy)
  "social_facebook", "social_instagram", "social_tiktok", "social_youtube", "social_pinterest",
  // Header (new header_* keys)
  "header_store_name", "header_tagline", "header_logo_url", "header_favicon_url",
  "header_show_topbar", "header_topbar_text", "header_topbar_bg_color", "header_topbar_text_color",
  "header_main_bg_color", "header_navbar_bg_color", "header_ticker_bg_color", "header_ticker_text_color",
  "header_ticker_messages", "header_show_ticker", "header_phone_display", "header_topbar_links",
  // Footer identity & display
  "footer_store_name", "footer_tagline", "footer_logo_url", "footer_show",
  // Footer legal
  "footer_company_name", "footer_cui", "footer_reg_com", "footer_capital_social", "footer_show_legal_data",
  // Footer contact
  "footer_email", "footer_phone", "footer_address", "footer_schedule",
  "footer_show_email", "footer_show_phone", "footer_show_address", "footer_show_schedule",
  // Footer social
  "footer_facebook_url", "footer_instagram_url", "footer_tiktok_url", "footer_youtube_url", "footer_pinterest_url",
  // Footer columns (new 4-col layout)
  "footer_col1_title", "footer_col1_links", "footer_col1_show",
  "footer_col2_title", "footer_col2_links", "footer_col2_show",
  "footer_col3_title", "footer_col3_show",
  "footer_col4_title", "footer_col4_show", "footer_col4_support_text",
  // Footer legacy columns
  "footer_show_products_col", "footer_products_title", "footer_products_links",
  "footer_show_info_col", "footer_info_title", "footer_info_links",
  "footer_show_contact_col", "footer_contact_title",
  // Footer company address
  "footer_address_street", "footer_address_city",
  // Footer contact button
  "footer_show_contact_btn", "footer_contact_btn_text", "footer_contact_btn_url",
  // Footer social
  "footer_social_show",
  // Footer ANPC / SAL logos
  "footer_anpc_show", "footer_anpc_url", "footer_anpc_logo_url", "footer_anpc_alt",
  "footer_sal_show", "footer_sal_url", "footer_sal_logo_url", "footer_sal_alt",
  // Footer partners
  "footer_partner_emag_show", "footer_partner_emag_url", "footer_partner_emag_logo",
  "footer_partner_compari_show", "footer_partner_compari_url", "footer_partner_compari_logo",
  "footer_partner_price_show", "footer_partner_price_url", "footer_partner_price_logo",
  // Footer payment icons
  "footer_show_payment_icons",
  "footer_payment_netopia_show", "footer_payment_visa_show", "footer_payment_mastercard_show",
  "footer_payment_tbi_show", "footer_payment_ramburs_show",
  // Footer copyright
  "footer_copyright_name", "footer_copyright_year_auto",
  "footer_made_in_romania_show", "footer_made_in_romania_text",
  // Footer colors
  "footer_bg_color", "footer_text_color", "footer_title_color", "footer_link_color",
  "footer_link_hover_color", "footer_bottom_bg_color", "footer_bottom_text_color",
  "footer_contact_btn_color",
  "contact_phone", "contact_email", "contact_address", "contact_schedule",
  "copyright_text", "anpc_display", "footer_upper_bg", "footer_lower_bg",
  // Navigation
  "nav_links", "trust_badges", "trust_strip_color", "ticker_text",
  // Homepage toggles
  "show_hero", "show_flash_deals", "show_categories", "show_promo_banners",
  "show_featured", "show_trust", "show_new_arrivals", "show_recently_viewed", "show_newsletter", "show_social_proof",
  // Misc
  "low_stock_threshold", "nav_bar_color", "header_bg",
  "bestsellers_title", "new_arrivals_title",
  "flash_deals_title", "categories_title",
  "newsletter_title", "newsletter_subtitle", "newsletter_bg",
  "delivery_time", "return_days", "delivery_description",
  "reviews_enabled", "catalog_items_per_page", "catalog_default_sort",
  "robots_txt", "loyalty_enabled",
  // ━━ Ticker bars ━━
  "ticker1_show", "ticker1_text", "ticker1_bg_color", "ticker1_text_color", "ticker1_speed", "ticker1_direction",
  "ticker2_show", "ticker2_messages", "ticker2_bg_color", "ticker2_text_color", "ticker2_speed", "ticker2_direction", "ticker2_separator",
  // ━━ Social proof ticker ━━
  "ticker_social_proof_show", "ticker_social_proof_source", "ticker_social_proof_template",
  "ticker_social_proof_limit", "ticker_social_proof_min_delay_minutes", "ticker_social_proof_anonymize", "ticker_social_proof_position",
  // ━━ Site alert ━━
  "site_alert_show", "site_alert_text", "site_alert_type", "site_alert_bg_color", "site_alert_text_color",
  "site_alert_dismissible", "site_alert_link_text", "site_alert_link_url",
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
  // ━━ Homepage raw JSON settings ━━
  "header_trust_bar", "homepage_benefits",
  // ━━ Product & catalog colors ━━
  "product_price_color", "product_stars_color", "badge_sale_color",
  "badge_new_color", "free_shipping_color", "savings_color",
  // ━━ Contact page ━━
  "contact_form_show", "contact_form_title", "contact_form_subtitle",
  "contact_form_btn_text", "contact_form_btn_color", "contact_form_gdpr_text", "contact_form_receiver_email",
  "contact_company_show", "contact_company_title", "contact_cod_fiscal", "contact_nr_reg_com",
  "contact_sediu_social", "contact_cont_bancar", "contact_banca", "contact_capital_social",
  "contact_show_cont_bancar", "contact_show_banca",
  "contact_section_contact_show", "contact_email_show", "contact_phone_show", "contact_address_show",
  "contact_cod_postal", "contact_cod_postal_show",
  "contact_support_show", "contact_support_title", "contact_support_text",
  "contact_docs_show", "contact_docs_anpc_text",
  "contact_doc1_show", "contact_doc1_label", "contact_doc1_url",
  "contact_doc2_show", "contact_doc2_label", "contact_doc2_url",
  "contact_doc3_show", "contact_doc3_label", "contact_doc3_url",
  "contact_doc4_show", "contact_doc4_label", "contact_doc4_url",
  "contact_caen_show", "contact_caen_codes",
  "contact_map_show", "contact_map_embed_url",
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

const CACHE_KEY = "lumax_settings_cache";

function loadCachedSettings(): SettingsMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCachedSettings(map: SettingsMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {}
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>(() => {
    const cached = loadCachedSettings();
    if (Object.keys(cached).length > 0) {
      // Apply cached theme immediately to prevent FOUC
      applyCSSVariables(cached);
    }
    return cached;
  });

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", SETTINGS_KEYS);

    if (!data) return;
    const map: SettingsMap = {};
    data.forEach((row: any) => {
      const val = row.value_json;
      const strVal = typeof val === "string" ? val : JSON.stringify(val);
      map[row.key] = strVal;
      // Store raw JSON for complex settings (arrays/objects)
      if (typeof val !== "string" && val !== null) {
        map[`_raw_${row.key}`] = JSON.stringify(val);
      }
    });
    setSettings(map);
    saveCachedSettings(map);
    applyCSSVariables(map);
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    // Optimistic update — apply CSS immediately
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      applyCSSVariables(updated);
      return updated;
    });

    // Try to store as proper JSON if it's valid JSON, otherwise store as string
    let dbValue: any = value;
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        dbValue = parsed; // Store arrays/objects as proper JSON, not double-encoded strings
      }
    } catch {}

    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key, value_json: dbValue, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
      .select("key, value_json");

    if (error) {
      console.error("Settings save failed:", error.message);
      fetchSettings();
      return false;
    }
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
