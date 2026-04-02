

# eMAG-Style Full Redesign for MamaLucica.ro

## Current State
The site currently has a **dark industrial luxury** theme (black #0F0F0F background, gold accents) — the exact opposite of eMAG's clean white commercial style. Every CSS variable, component background, and text color needs to flip to a light, white-based palette.

## Design System

```text
Token              Value                  HSL
─────────────────────────────────────────────────
background         #FFFFFF (white)        0 0% 100%
foreground         #222222 (dark text)    0 0% 13%
card               #FFFFFF                0 0% 100%
muted              #F5F5F5 (light gray)   0 0% 96%
muted-foreground   #555555                0 0% 33%
primary            #FF4D00 (eMAG orange)  16 100% 50%
primary-foreground #FFFFFF                0 0% 100%
secondary          #FF6B00 (hover orange) 24 100% 50%
accent             #C13584 (pink)         348 62% 49%
border             #E5E5E5                0 0% 90%
input              #E5E5E5                0 0% 90%
```

## Plan

### 1. Update CSS tokens (`src/index.css`)
- Replace all `:root` variables from dark industrial to white eMAG palette above
- Change scrollbar colors from dark to light gray
- Keep `.admin-panel` and `.admin-sidebar` blocks unchanged
- Keep heading font as **Inter** (bold, sans-serif like eMAG) instead of Playfair Display — eMAG uses clean sans-serif everywhere

### 2. Update theme defaults (`src/hooks/useTheme.tsx`)
- Update `DEFAULTS` object colors to match the new white/orange palette
- Set `font_family` and `heading_font` both to `"Inter"` (eMAG uses sans-serif headings, not serif)
- Set `button_shape: "rounded"`, `button_hover: "shadow"`

### 3. Update Tailwind config (`tailwind.config.ts`)
- Update `--ml-*` store token defaults to match eMAG orange palette
- Update font families: primary sans to Inter, remove serif priority for headings

### 4. Redesign Header (`src/components/layout/Header.tsx`)
- **Top bar**: White bg, subtle gray border bottom, small text in dark gray
- **Main row**: White bg, logo in bold dark text (not orange serif), large search bar with light gray bg and orange search icon/button, dark icon buttons
- **Nav bar**: White bg, orange "Toate Produsele" button, dark text links with orange hover/underline
- **Mobile overlay**: White bg with dark text instead of dark bg with white text

### 5. Redesign Footer (`src/components/layout/Footer.tsx`)
- Change from `bg-foreground` (was black) to a clean `bg-[#222222]` with white text
- Or use the light approach: `bg-[#F5F5F5]` with dark text, eMAG-style
- Keep 4-column layout, use orange for brand name and icon accents

### 6. Redesign HeroSlider (`src/components/home/HeroSlider.tsx`)
- Change gradient fallback from dark to vibrant orange gradient
- Make CTA button bold, rounded, orange with white text
- Ensure strong commercial promotional feel

### 7. Update ProductCard (`src/components/products/ProductCard.tsx`)
- White card bg, subtle gray border (`border-gray-200`), clean shadow on hover
- Price in bold orange, old price in gray strikethrough
- "Adaugă în coș" button: solid orange, white text, rounded, always visible (not just on hover)
- Badges: orange for discounts, clean styling

### 8. Update Layout (`src/components/layout/Layout.tsx`)
- Mobile bottom nav: white bg, orange active state — already works with token changes

### 9. Database migration for `site_theme_settings`
- Update all color settings to match the eMAG palette
- Set fonts to Inter/Inter, spacing to spacious, border_radius to 8

### Files to modify
1. `src/index.css` — CSS variables
2. `tailwind.config.ts` — store tokens, fonts
3. `src/hooks/useTheme.tsx` — DEFAULTS
4. `src/components/layout/Header.tsx` — eMAG-style header
5. `src/components/layout/Footer.tsx` — clean footer
6. `src/components/home/HeroSlider.tsx` — promotional hero
7. `src/components/products/ProductCard.tsx` — clean product cards
8. Database migration — theme settings

