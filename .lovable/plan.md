

# Plan: Sincronizare Completă Admin ↔ Storefront

## Rezumat

Proiectul are 3 surse de setări tematice care nu sunt complet conectate la storefront:
1. **`site_theme_settings`** (HSL) — citit de `useTheme.tsx` ✅ funcționează
2. **`app_settings.theme_settings`** (hex, custom CSS) — parțial conectat (doar customCss)
3. **`AdminThemeEditorExtended`** (butoane, CTA, heading_size, bg_color, trust_icons) — **complet deconectat** de storefront

De asemenea, `button_shape` și `button_style` din `site_theme_settings` sunt stocate dar nu aplicate vizual în CSS-ul generat.

---

## Schimbări planificate

### 1. Extinderea `useTheme.tsx` — Citirea setărilor Extended

**Fișier**: `src/hooks/useTheme.tsx`

- În funcția `fetchTheme`, după ce citim `site_theme_settings` și `app_settings.theme_settings`, adăugăm un al treilea fetch din `app_settings` pentru cheile Extended: `btn_bg_color`, `btn_text_color`, `btn_text_style`, `cta_bg_color`, `cta_text_color`, `cta_text_style`, `heading_size`, `bg_color`, `trust_icons`.
- Aplicăm aceste valori ca CSS custom properties pe `:root`:
  - `--btn-bg`, `--btn-text`, `--cta-bg`, `--cta-text`
  - `--heading-scale` (bazat pe `heading_size`: small=0.85, standard=1, medium=1.15, large=1.3)
- Adăugăm CSS dinamic pentru `button_shape` (square/rounded/pill) și `button_style` (filled/outline/ghost) pe butoanele storefront.
- Adăugăm CSS pentru `btn_text_style` și `cta_text_style` (bold/italic/underline/uppercase).

### 2. Sincronizarea culorilor Extended la publicare

**Fișier**: `src/components/admin/settings/AdminThemeEditorExtended.tsx`

- La `save()`, pe lângă scrierea în `app_settings`, sincronizăm și la `site_theme_settings` cheile relevante (ex: `bg_color` → convertit HSL → `background_color`) pentru consistență.
- Adăugăm Supabase Realtime listener pe `app_settings` changes cu cheile extended, ca storefront-ul să se actualizeze instant (<10s).

### 3. Sincronizarea completă la Publish din Theme Editor principal

**Fișier**: `src/components/admin/settings/AdminThemeEditor.tsx`

- Completăm sync-ul existent: adăugăm `button_style`, `button_shape`, `spacing_density` la lista `syncRows`.
- Sincronizăm și culorile `muted`, `border`, `card` la `site_theme_settings`.

### 4. Pagina "Despre Noi" — Eliminare conținut hardcodat vechi

**Fișier**: `src/pages/PovesteaNoastra.tsx`

- Eliminăm blocul fallback hardcodat (afișat când `sections.length === 0`).
- Înlocuim cu un fallback care folosește `defaultSections` (deja definit dar neutilizat ca state inițial).
- Astfel, dacă admin-ul are secțiuni salvate, apar cele din DB; altfel se afișează `defaultSections` — fără suprapuneri.

### 5. Adăugarea realtime pe `app_settings` pentru conținut dinamic

**Fișier**: `src/hooks/useTheme.tsx`

- Extindem canalul Realtime existent pentru a asculta și `app_settings` (filtrând pe cheile de temă), re-fetchând automat la orice schimbare.

### 6. Aplicarea trust_icons pe storefront

**Fișier**: `src/hooks/useTheme.tsx` sau o nouă componentă `TrustIcons.tsx`

- Creăm un hook `useExtendedTheme()` care expune `trust_icons` din `app_settings`.
- Adăugăm o componentă `TrustIcons` afișată în Footer (sau sub butonul "Adaugă în coș" pe pagina de produs) care citește iconurile din context.

---

## Ce rămâne conectat / deconectat după implementare

**Complet conectat:**
- ✅ Culori (primary, secondary, accent, background, foreground, muted, border, card)
- ✅ Tipografie (font body, heading, weights, sizes, line-height)
- ✅ Butoane (border-radius, hover, shape, style, text-transform, colors CTA)
- ✅ Layout (spacing density, container width, card border radius)
- ✅ Custom CSS
- ✅ Pagini statice (Povestea/FAQ/Îngrijire via app_settings)
- ✅ Trust Icons
- ✅ Heading size scale
- ✅ Vizibilitate elemente (useVisibility)
- ✅ Layout settings (useLayoutSettings)
- ✅ Store Branding (useStoreBranding)
- ✅ Navigation & Footer links (via CMS pages + footer settings)

**Necesită configurare externă (nu cod):**
- ⚠️ Integrări plată (Netopia, Mokka) — necesită chei API reale
- ⚠️ Email (Resend) — necesită configurare SPF/DKIM
- ⚠️ AWB/Facturi — necesită chei SmartBill/Sameday

---

## Fișiere modificate

| Fișier | Acțiune |
|--------|---------|
| `src/hooks/useTheme.tsx` | Extindere: citire extended theme, realtime pe app_settings, aplicare CSS butoane/heading |
| `src/components/admin/settings/AdminThemeEditor.tsx` | Completare sync rows la publish |
| `src/components/admin/settings/AdminThemeEditorExtended.tsx` | Adăugare sync la site_theme_settings + realtime |
| `src/pages/PovesteaNoastra.tsx` | Fix fallback: folosirea defaultSections, eliminare duplicare |
| `src/components/layout/Footer.tsx` | Adăugare TrustIcons component |
| `src/components/TrustIcons.tsx` | NOU — componentă care citește și afișează trust icons |

