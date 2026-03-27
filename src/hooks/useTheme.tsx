import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeSettings {
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    background: string;
    foreground: string;
    card: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyHeadings: string;
    baseFontSize: number;
    h1Size: number;
    h2Size: number;
    h3Size: number;
    h1Weight: string;
    h2Weight: string;
    h3Weight: string;
    bodyWeight: string;
    lineHeight: number;
  };
  buttons: {
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    fontWeight: string;
    textTransform: "none" | "uppercase" | "capitalize";
    hoverEffect: "darken" | "lighten" | "shadow" | "scale";
  };
  layout: {
    containerMaxWidth: number;
    sectionSpacing: number;
    cardBorderRadius: number;
    headerStyle: "gradient" | "solid" | "transparent";
  };
  customCss: string;
  isPublished: boolean;
}

function hexToHsl(hex: string): string {
  try {
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
  } catch {
    return "0 0% 50%";
  }
}

const ThemeContext = createContext<ThemeSettings | null>(null);

export function useThemeSettings() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "theme_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) {
        const t = data.value_json as unknown as ThemeSettings;
        if (t.isPublished !== false) {
          setTheme(t);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!theme) return;

    const c = theme.colors;
    const t = theme.typography;
    const b = theme.buttons;
    const l = theme.layout;

    // Inject Google Fonts
    const fonts = [t.fontFamily, t.fontFamilyHeadings]
      .filter((f, i, a) => a.indexOf(f) === i)
      .map(f => f.replace(/ /g, "+"))
      .join("&family=");
    
    let fontLink = document.getElementById("theme-google-fonts") as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "theme-google-fonts";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@400;500;600;700;800&display=swap`;

    // Build and inject CSS
    const hoverCss = {
      darken: "filter: brightness(0.9);",
      lighten: "filter: brightness(1.1);",
      shadow: "box-shadow: 0 4px 16px rgba(0,0,0,0.2);",
      scale: "transform: scale(1.05);",
    }[b.hoverEffect] || "";

    const css = `
:root {
  --background: ${hexToHsl(c.background)};
  --foreground: ${hexToHsl(c.foreground)};
  --card: ${hexToHsl(c.card)};
  --card-foreground: ${hexToHsl(c.foreground)};
  --popover: ${hexToHsl(c.card)};
  --popover-foreground: ${hexToHsl(c.foreground)};
  --primary: ${hexToHsl(c.primary)};
  --primary-foreground: ${hexToHsl(c.primaryForeground)};
  --secondary: ${hexToHsl(c.secondary)};
  --secondary-foreground: ${hexToHsl(c.secondaryForeground)};
  --muted: ${hexToHsl(c.muted)};
  --muted-foreground: ${hexToHsl(c.mutedForeground)};
  --accent: ${hexToHsl(c.accent)};
  --accent-foreground: ${hexToHsl(c.accentForeground)};
  --destructive: ${hexToHsl(c.destructive)};
  --destructive-foreground: 0 0% 100%;
  --border: ${hexToHsl(c.border)};
  --input: ${hexToHsl(c.border)};
  --ring: ${hexToHsl(c.primary)};
  --radius: ${b.borderRadius / 16}rem;
}
body:not(.admin-panel) {
  font-family: '${t.fontFamily}', system-ui, sans-serif;
  font-size: ${t.baseFontSize}px;
  line-height: ${t.lineHeight};
  font-weight: ${t.bodyWeight};
}
body:not(.admin-panel) h1, body:not(.admin-panel) h2, body:not(.admin-panel) h3,
body:not(.admin-panel) h4, body:not(.admin-panel) h5, body:not(.admin-panel) h6 {
  font-family: '${t.fontFamilyHeadings}', system-ui, sans-serif;
}
body:not(.admin-panel) h1 { font-size: ${t.h1Size}px; font-weight: ${t.h1Weight}; }
body:not(.admin-panel) h2 { font-size: ${t.h2Size}px; font-weight: ${t.h2Weight}; }
body:not(.admin-panel) h3 { font-size: ${t.h3Size}px; font-weight: ${t.h3Weight}; }
body:not(.admin-panel) .container { max-width: ${l.containerMaxWidth}px; }
body:not(.admin-panel) button, body:not(.admin-panel) [role="button"] {
  text-transform: ${b.textTransform};
  transition: all 0.2s ease;
}
body:not(.admin-panel) button:hover, body:not(.admin-panel) [role="button"]:hover {
  ${hoverCss}
}
${theme.customCss || ""}`;

    let styleEl = document.getElementById("theme-dynamic-css") as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-dynamic-css";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    return () => {
      // Cleanup on unmount (won't fire normally since ThemeProvider wraps the app)
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
