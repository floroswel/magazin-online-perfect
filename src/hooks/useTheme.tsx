import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeSettings {
  color_mode: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  font_size_scale: string;
  heading_weight: string;
  line_height: string;
  button_shape: string;
  button_style: string;
  button_hover: string;
  border_radius: number;
  spacing_density: string;
}

const DEFAULTS: ThemeSettings = {
  color_mode: "auto",
  primary_color: "210 40% 50%",
  secondary_color: "210 20% 60%",
  background_color: "0 0% 100%",
  text_color: "210 40% 10%",
  font_family: "Inter",
  font_size_scale: "medium",
  heading_weight: "bold",
  line_height: "normal",
  button_shape: "rounded",
  button_style: "filled",
  button_hover: "scale",
  border_radius: 8,
  spacing_density: "normal",
};

const ThemeContext = createContext<ThemeSettings | null>(null);

export function useThemeSettings() {
  return useContext(ThemeContext);
}

function applyThemeToDOM(theme: ThemeSettings) {
  const root = document.documentElement;

  // Colors — values are already HSL strings from DB
  const colorMap: Record<string, string> = {
    "--primary": theme.primary_color,
    "--secondary": theme.secondary_color,
    "--background": theme.background_color,
    "--foreground": theme.text_color,
  };

  Object.entries(colorMap).forEach(([prop, val]) => {
    if (val) root.style.setProperty(prop, val);
  });

  // Border radius
  if (theme.border_radius != null) {
    root.style.setProperty("--radius", `${theme.border_radius / 16}rem`);
  }

  // Font
  if (theme.font_family && theme.font_family !== "Inter") {
    let fontLink = document.getElementById("theme-google-fonts") as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "theme-google-fonts";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?family=${theme.font_family.replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`;
  }

  // Font size scale
  const scaleMap: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
  if (scaleMap[theme.font_size_scale]) {
    root.style.setProperty("--base-font-size", scaleMap[theme.font_size_scale]);
  }

  // Build dynamic CSS
  let styleEl = document.getElementById("theme-dynamic-css") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "theme-dynamic-css";
    document.head.appendChild(styleEl);
  }

  const fontFamily = theme.font_family || "Inter";
  const lineHeightMap: Record<string, string> = { compact: "1.4", normal: "1.6", relaxed: "1.8" };
  const lh = lineHeightMap[theme.line_height] || "1.6";
  const hoverMap: Record<string, string> = {
    darken: "filter: brightness(0.9);",
    lighten: "filter: brightness(1.1);",
    shadow: "box-shadow: 0 4px 16px rgba(0,0,0,0.2);",
    scale: "transform: scale(1.05);",
  };
  const hoverCss = hoverMap[theme.button_hover] || "";

  styleEl.textContent = `
body:not(.admin-panel) {
  font-family: '${fontFamily}', system-ui, sans-serif;
  line-height: ${lh};
}
body:not(.admin-panel) h1, body:not(.admin-panel) h2, body:not(.admin-panel) h3,
body:not(.admin-panel) h4, body:not(.admin-panel) h5, body:not(.admin-panel) h6 {
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

    // Realtime subscription for instant theme updates
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
