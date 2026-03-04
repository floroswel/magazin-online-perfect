

# Plan: Replace Hardcoded Store Values with Dynamic Settings

## Scope

Replace all hardcoded "MegaShop", "lei" currency labels, and the fixed `10000` max price in catalog filters with dynamic values from the database.

## Approach

Create a **`useStoreBranding`** hook (or extend existing patterns) that provides store name/emoji globally. Several pages already fetch `store_branding` from `app_settings` individually — we'll centralize this into a React context so all components share one fetch.

For the catalog max price, fetch `MAX(price)` from products on mount.

For currency in the price filter, use the existing `useCurrency` hook.

## Changes

### 1. Create `src/hooks/useStoreBranding.tsx` — new context/provider

- Fetches `store_branding` from `app_settings` table once on mount
- Provides `{ name, emoji, tagline, phone, email, copyright }` with "MegaShop" defaults
- Also updates `document.title` dynamically
- Wrap in `App.tsx` alongside other providers

### 2. Update `src/App.tsx`

- Add `StoreBrandingProvider` wrapper
- No logic changes

### 3. Update these files to use `useStoreBranding()` instead of hardcoded "MegaShop":

| File | What changes |
|---|---|
| `src/components/layout/Header.tsx` | Use context instead of local `branding` state + fetch (remove duplicate fetch) |
| `src/components/layout/Footer.tsx` | Use context for fallback values |
| `src/components/admin/AdminSidebar.tsx` | Replace two hardcoded "MegaShop" strings |
| `src/pages/Auth.tsx` | Replace `🛒 MegaShop` in CardTitle |
| `src/pages/Install.tsx` | Replace `Instalează MegaShop` |
| `src/pages/Index.tsx` | Replace `name: "MegaShop"` in JSON-LD schema |
| `src/pages/CmsPage.tsx` | Replace fallback `"MegaShop"` in document.title |

### 4. Update `src/pages/Catalog.tsx` — dynamic max price + currency

- On mount, run `supabase.from("products").select("price").order("price", { ascending: false }).limit(1)` to get max price
- Round up to nearest 100 for slider max
- Replace hardcoded `10000` with this dynamic value
- Replace `lei` labels with `useCurrency().symbol`
- Update active filter count check to use dynamic max

### 5. `index.html` — stays hardcoded

HTML meta tags are static and cannot be dynamically updated from DB before React mounts. The `useStoreBranding` hook will update `document.title` at runtime, which is sufficient. OG tags remain static (they're for crawlers that won't execute JS anyway).

## Files to Create
- `src/hooks/useStoreBranding.tsx`

## Files to Modify
- `src/App.tsx` (add provider)
- `src/components/layout/Header.tsx` (use context, remove local branding fetch)
- `src/components/layout/Footer.tsx` (use context for fallbacks)
- `src/components/admin/AdminSidebar.tsx` (use context)
- `src/pages/Auth.tsx` (use context)
- `src/pages/Install.tsx` (use context)
- `src/pages/Index.tsx` (use context in JSON-LD)
- `src/pages/CmsPage.tsx` (use context for fallback title)
- `src/pages/Catalog.tsx` (dynamic max price + currency symbol)

## No changes to
- Admin settings pages (they manage these values, no hardcoded display)
- `useCurrency.tsx` (already fetches from DB)
- `index.html` (static, updated at runtime via document.title)

