// Legacy file — useTheme system has been removed.
// All theme management is now handled by useSettings (app_settings table).
// This file is kept only to avoid breaking any stale imports.

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
  primary_color: "213 100% 50%",
  secondary_color: "0 0% 7%",
  accent_color: "14 100% 50%",
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

export function applyThemeToDOM(_theme: ThemeSettings) {
  // No-op — CSS variables are now managed by useSettings / applyCSSVariables
}
