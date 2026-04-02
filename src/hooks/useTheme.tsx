import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeSettings {
  color_mode: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  heading_font: string;
  font_size_scale: string;
  heading_weight: string;
  line_height: string;
  button_shape: string;
  button_style: string;
  button_hover: string;
  border_radius: number;
  spacing_density: string;
}

export const DEFAULTS: ThemeSettings = {
  color_mode: "light",
  primary_color: "16 100% 50%",
  secondary_color: "24 100% 50%",
  accent_color: "348 62% 49%",
  background_color: "0 0% 100%",
  text_color: "0 0% 13%",
  font_family: "Inter",
  heading_font: "Inter",
  font_size_scale: "medium",
  heading_weight: "bold",
  line_height: "normal",
  button_shape: "rounded",
  button_style: "filled",
  button_hover: "shadow",
  border_radius: 8,
  spacing_density: "spacious",
};

const ThemeContext = createContext<ThemeSettings | null>(null);

export function useThemeSettings() {
  return useContext(ThemeContext);
}

/**
 * Parse an HSL string like "210 40% 50%" into [h, s, l] numbers.
 * Returns null when the string is not parseable.
 */
function parseHSL(hsl: string): [number, number, number] | null {
  if (!hsl) return null;
  const parts = hsl.replace(/%/g, "").trim().split(/\s+/);
  if (parts.length < 3) return null;
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
}

/** Approximate relative luminance from HSL lightness — light ≥ 60 */
function isLightColor(hsl: string): boolean {
  const parsed = parseHSL(hsl);
  if (!parsed) return false;
  return parsed[2] >= 60;
}

/** Return a contrasting foreground for a given HSL background */
function contrastForeground(bgHSL: string, lightFg = "0 0% 100%", darkFg = "220 15% 15%"): string {
  return isLightColor(bgHSL) ? darkFg : lightFg;
}

export function applyThemeToDOM(theme: ThemeSettings) {
  const root = document.documentElement;

  // Apply base colors
  const colorMap: Record<string, string> = {
    "--primary": theme.primary_color,
    "--secondary": theme.secondary_color,
    "--accent": theme.accent_color,
    "--background": theme.background_color,
    "--foreground": theme.text_color,
  };

  Object.entries(colorMap).forEach(([prop, val]) => {
    if (val) root.style.setProperty(prop, val);
  });

  // Auto-compute contrasting foreground colors so header/buttons never become invisible
  if (theme.primary_color) {
    root.style.setProperty("--primary-foreground", contrastForeground(theme.primary_color));
  }
  if (theme.secondary_color) {
    root.style.setProperty("--secondary-foreground", contrastForeground(theme.secondary_color));
  }
  if (theme.accent_color) {
    root.style.setProperty("--accent-foreground", contrastForeground(theme.accent_color));
  }
  if (theme.background_color) {
    // Card is slightly lighter/warmer than background for elevation
    const bgParsed = parseHSL(theme.background_color);
    const cardHSL = bgParsed ? `${bgParsed[0]} ${Math.max(bgParsed[1], 20)}% ${Math.min(bgParsed[2] + 3, 98)}%` : theme.background_color;
    root.style.setProperty("--card", cardHSL);
    root.style.setProperty("--card-foreground", contrastForeground(cardHSL));
    root.style.setProperty("--popover", cardHSL);
    root.style.setProperty("--popover-foreground", contrastForeground(cardHSL));
  }

  if (theme.border_radius != null) {
    root.style.setProperty("--radius", `${theme.border_radius / 16}rem`);
  }

  // Load fonts
  const fontsToLoad = new Set<string>();
  if (theme.font_family && theme.font_family !== "Inter") fontsToLoad.add(theme.font_family);
  if (theme.heading_font && theme.heading_font !== "Inter") fontsToLoad.add(theme.heading_font);

  if (fontsToLoad.size > 0) {
    let fontLink = document.getElementById("theme-google-fonts") as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "theme-google-fonts";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    const families = Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`).join("&");
    fontLink.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }

  const scaleMap: Record<string, string> = { small: "14px", medium: "16px", large: "18px", xl: "20px" };
  if (scaleMap[theme.font_size_scale]) {
    root.style.setProperty("--base-font-size", scaleMap[theme.font_size_scale]);
  }

  // Spacing density
  const spacingMap: Record<string, string> = { compact: "0.75", normal: "1", spacious: "1.35" };
  root.style.setProperty("--spacing-scale", spacingMap[theme.spacing_density] || "1");

  let styleEl = document.getElementById("theme-dynamic-css") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "theme-dynamic-css";
    document.head.appendChild(styleEl);
  }

  const bodyFont = theme.font_family || "Inter";
  const headingFont = theme.heading_font || bodyFont;
  const lineHeightMap: Record<string, string> = { compact: "1.4", normal: "1.6", relaxed: "1.8" };
  const lh = lineHeightMap[theme.line_height] || "1.6";
  const hoverMap: Record<string, string> = {
    darken: "filter: brightness(0.9);",
    lighten: "filter: brightness(1.1);",
    shadow: "box-shadow: 0 4px 16px rgba(0,0,0,0.2);",
    scale: "transform: scale(1.05);",
    glow: "box-shadow: 0 0 20px hsl(var(--primary) / 0.4);",
  };
  const hoverCss = hoverMap[theme.button_hover] || "";

  styleEl.textContent = `
body:not(.admin-panel) {
  font-family: '${bodyFont}', system-ui, sans-serif;
  line-height: ${lh};
}
body:not(.admin-panel) h1, body:not(.admin-panel) h2, body:not(.admin-panel) h3,
body:not(.admin-panel) h4, body:not(.admin-panel) h5, body:not(.admin-panel) h6 {
  font-family: '${headingFont}', '${bodyFont}', serif;
  font-weight: ${theme.heading_weight === "bold" ? "700" : theme.heading_weight === "extrabold" ? "800" : "600"};
}
body:not(.admin-panel) button:hover, body:not(.admin-panel) [role="button"]:hover {
  ${hoverCss}
}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);

  const fetchTheme = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("site_theme_settings")
      .select("setting_key, value_json");
    if (data && data.length > 0) {
      const merged = { ...DEFAULTS };
      data.forEach((row: any) => {
        if (row.setting_key in merged) {
          (merged as any)[row.setting_key] = typeof row.value_json === "string"
            ? row.value_json.replace(/^"|"$/g, "")
            : row.value_json;
        }
      });
      setTheme(merged);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
    const channel = supabase
      .channel("theme-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_theme_settings" },
        () => { fetchTheme(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTheme]);

  useEffect(() => {
    if (theme) applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
