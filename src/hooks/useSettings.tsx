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
  "footer_brand_description",
  // Footer Trust Strip (4 icons row)
  "footer_trust_show",
  "footer_trust_1_show", "footer_trust_1_icon", "footer_trust_1_title", "footer_trust_1_subtitle",
  "footer_trust_2_show", "footer_trust_2_icon", "footer_trust_2_title", "footer_trust_2_subtitle",
  "footer_trust_3_show", "footer_trust_3_icon", "footer_trust_3_title", "footer_trust_3_subtitle",
  "footer_trust_4_show", "footer_trust_4_icon", "footer_trust_4_title", "footer_trust_4_subtitle",
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
  "footer_col3_title", "footer_col3_links", "footer_col3_show",
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
  // Hero
  "hero_title", "hero_subtitle", "hero_cta_text", "hero_cta_url", "hero_image_url",
  "bestsellers_title", "new_arrivals_title",
  "flash_deals_title", "categories_title",
  "newsletter_title", "newsletter_subtitle", "newsletter_bg", "newsletter_trust_text",
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
  // ━━ New theme keys ━━
  "ticker_messages", "ticker_bg_color", "ticker_text_color", "ticker_speed",
  "popup_show", "popup_delay_seconds", "popup_discount_code", "popup_discount_percent",
  "social_proof_show", "social_proof_interval_seconds",
  "whatsapp_show", "whatsapp_number", "whatsapp_message",
  "megamenu_banner_image", "megamenu_banner_url",
  "theme_primary_color", "theme_navbar_color", "theme_topbar_color",
  "theme_footer_color", "theme_ticker_color",
  "theme_font_heading", "theme_font_body",
  "theme_container_width", "theme_radius_card", "theme_radius_btn",
  // ━━ Header dynamic texts ━━
  "header_welcome_text", "header_track_text", "header_locale_text", "header_search_placeholder",
  // ━━ Theme hero gradient ━━
  "theme_hero_gradient_start", "theme_hero_gradient_mid", "theme_hero_gradient_end",
  // ━━ Homepage banners ━━
  "homepage_show_banners", "homepage_show_brand_story",
  "homepage_banner1_label", "homepage_banner1_title", "homepage_banner1_cta",
  "homepage_banner1_url", "homepage_banner1_image",
  "homepage_banner1_gradient_from", "homepage_banner1_gradient_to",
  "homepage_banner2_label", "homepage_banner2_subtitle", "homepage_banner2_price",
  "homepage_banner2_cta", "homepage_banner2_url",
  "homepage_banner2_gradient_from", "homepage_banner2_gradient_to",
  // ━━ Homepage brand story ━━
  "homepage_brand_label", "homepage_brand_title", "homepage_brand_text",
  "homepage_brand_cta", "homepage_brand_url", "homepage_brand_image",
  // ━━ Homepage products description ━━
  "homepage_products_description",
  // ━━ Homepage sections JSON ━━
  "homepage_sections", "homepage_promo_banner", "homepage_why_us", "homepage_brands",
  // ━━ Footer new colors ━━
  "footer_main_bg", "footer_copyright_bg",
  // ━━ Footer steps ━━
  "footer_show_steps",
  "footer_step1_icon", "footer_step1_title", "footer_step1_text",
  "footer_step2_icon", "footer_step2_title", "footer_step2_text",
  "footer_step3_icon", "footer_step3_title", "footer_step3_text",
  "footer_step4_icon", "footer_step4_title", "footer_step4_text",
  // ━━ Footer delivery/payment badges ━━
  "footer_delivery_badges", "footer_payment_badges",
  // ━━ Benefits section ━━
  "show_benefits",
  "benefit_1_icon", "benefit_1_title", "benefit_1_subtitle",
  "benefit_2_icon", "benefit_2_title", "benefit_2_subtitle",
  "benefit_3_icon", "benefit_3_title", "benefit_3_subtitle",
  "benefit_4_icon", "benefit_4_title", "benefit_4_subtitle",
  // ━━ Mid banner ━━
  "show_mid_banner", "mid_banner_image", "mid_banner_text", "mid_banner_url", "mid_banner_bg",
  // ━━ Navbar special link ━━
  "navbar_special_link_text", "navbar_special_link_url", "navbar_special_link_color",
  // ━━ Section counts ━━
  "categories_count", "new_arrivals_count", "featured_count",
  // ━━ WhatsApp extras ━━
  "whatsapp_position", "whatsapp_color",
  // ━━ Popup extras ━━
  "popup_title", "popup_subtitle", "popup_btn_color", "popup_btn_text",
  // ━━ Newsletter extras ━━
  "newsletter_btn_text", "newsletter_text_color",
  // ━━ Mega menu ━━
  "show_megamenu", "megamenu_banner_text", "megamenu_categories_count",
  // ━━ Header toggles ━━
  "header_topbar_show", "header_topbar_right_text",
  "header_show_compare", "header_show_favorites", "header_show_account",
  "search_border_color",
  // ━━ Hero extras ━━
  "hero_show_second_btn", "hero_second_btn_text", "hero_second_btn_url",
  // ━━ Badge colors ━━
  "badge_hot_color",
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

function parseHSL(hsl: string): { h: number; s: number; l: number } | null {
  const parts = hsl.replace(/%/g, "").trim().split(/\s+/);
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if ([h, s, l].some(Number.isNaN)) return null;
  return { h, s, l };
}

function formatHSL({ h, s, l }: { h: number; s: number; l: number }) {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function withLightness(hsl: string, lightness: number) {
  const parsed = parseHSL(hsl);
  if (!parsed) return hsl;
  return formatHSL({ ...parsed, l: Math.max(0, Math.min(100, lightness)) });
}

function shiftLightness(hsl: string, delta: number) {
  const parsed = parseHSL(hsl);
  if (!parsed) return hsl;
  return formatHSL({ ...parsed, l: Math.max(0, Math.min(100, parsed.l + delta)) });
}

/* ── Apply settings as CSS custom properties so the whole storefront reacts ── */
function applyCSSVariables(s: SettingsMap) {
  const root = document.documentElement;
  const body = document.body;

  // ━━ Force default theme colors to prevent stale cache ━━
  root.style.setProperty('--primary', '213 95% 55%');
  root.style.setProperty('--primary-foreground', '0 0% 100%');
  root.style.setProperty('--secondary', '0 0% 20%');
  root.style.setProperty('--secondary-foreground', '0 0% 100%');
  root.style.setProperty('--background', '0 0% 96%');
  root.style.setProperty('--foreground', '0 0% 13%');
  root.style.setProperty('--ring', '213 95% 55%');
  root.style.setProperty('--color-primary', s.primary_color || '#141414');
  root.style.setProperty('--color-navbar', '#333333');
  root.style.setProperty('--color-ticker', '#d32f2f');
  root.style.setProperty('--color-footer', '#1f1f1f');
  root.style.setProperty('--color-price', '#f97316');

  // ━━ Brand Colors → HSL for Shadcn ━━
  if (s.primary_color) {
    const hsl = hexToHSL(s.primary_color);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--primary-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
      root.style.setProperty("--ml-primary", hsl);
      root.style.setProperty("--ml-primary-hover", shiftLightness(hsl, 6));
      root.style.setProperty("--ml-primary-dark", shiftLightness(hsl, -8));
      root.style.setProperty("--ml-primary-darker", shiftLightness(hsl, -16));
      root.style.setProperty("--ml-primary-light", withLightness(hsl, 95));
      root.style.setProperty("--color-primary", s.primary_color);
    }
  }
  if (s.secondary_color) {
    const hsl = hexToHSL(s.secondary_color);
    if (hsl) {
      root.style.setProperty("--secondary", hsl);
      root.style.setProperty("--secondary-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
      root.style.setProperty("--ml-dark", hsl);
    }
  }
  if (s.accent_color) {
    const hsl = hexToHSL(s.accent_color);
    if (hsl) {
      root.style.setProperty("--accent", hsl);
      root.style.setProperty("--accent-foreground", isLightHSL(hsl) ? "220 15% 15%" : "0 0% 100%");
      root.style.setProperty("--ml-accent", hsl);
      root.style.setProperty("--color-accent", s.accent_color);
    }
  }
  if (s.background_color) {
    const hsl = hexToHSL(s.background_color);
    if (hsl) {
      root.style.setProperty("--background", hsl);
      root.style.setProperty("--card", withLightness(hsl, 97));
      root.style.setProperty("--popover", withLightness(hsl, 97));
      root.style.setProperty("--muted", withLightness(hsl, 92));
      root.style.setProperty("--color-bg", s.background_color);
      root.style.backgroundColor = s.background_color;
      body?.style.setProperty("background-color", s.background_color);
    }
  }
  if (s.text_color) {
    const hsl = hexToHSL(s.text_color);
    if (hsl) {
      root.style.setProperty("--foreground", hsl);
      root.style.setProperty("--card-foreground", hsl);
      root.style.setProperty("--popover-foreground", hsl);
      root.style.setProperty("--secondary-foreground", hsl);
      root.style.setProperty("--muted-foreground", withLightness(hsl, 38));
      root.style.setProperty("--border", withLightness(hsl, 84));
      root.style.setProperty("--input", withLightness(hsl, 84));
    }
    root.style.setProperty("--ml-text", hsl || s.text_color);
    root.style.setProperty("--color-text", s.text_color);
    body?.style.setProperty("color", s.text_color);
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
    root.style.setProperty("--ml-primary-dark", s.nav_bar_color);
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

const CACHE_KEY = "ml_settings_cache";

function loadCachedSettings(): SettingsMap {
  try {
    // Clear stale cache from old theme
    localStorage.removeItem(CACHE_KEY);
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
            saveCachedSettings(updated);
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
