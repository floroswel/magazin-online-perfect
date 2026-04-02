

# VERSION 13.0 — Sync Fix & Hardcoded String Cleanup

## Diagnosis

The central settings system (`useEditableContent` + `EditableContentProvider` + `AdminEditableContent`) **already exists and is correctly wired**:
- Provider wraps the app in `App.tsx`
- Supabase Realtime subscription is active on `app_settings`
- All major components (Header, Footer, AnnouncementCountdown, WhyVentuza, ProcessSection, ScentGuideTeaser, TrustFooterStrip, SocialProofBar, SeoHead) already use `useEditableContent()`

**Root cause of "changes not appearing"**: No `editable_*` rows exist in the database yet. The admin editor saves on demand — if nobody has clicked "Salvează Tot" in the Content Editor, all components fall back to hardcoded defaults. This is working as designed.

## What Actually Needs Fixing

### 1. Seed default content on first save / app init
Add an "Initialize Defaults" button in AdminEditableContent that writes all EDITABLE_DEFAULTS to the database, ensuring the round-trip works immediately.

### 2. Remove remaining hardcoded "MamaLucica" strings (5 files)
These files still have hardcoded brand names instead of reading from `useEditableContent`:

| File | Current | Fix |
|------|---------|-----|
| `src/pages/ProductDetail.tsx` | `"MamaLucica"` in SEO title | Read from `useEditableContent().store_general.store_name` |
| `src/pages/CmsPage.tsx` | `"MamaLucica"` in page title | Read from `useEditableContent().store_general.store_name` |
| `src/components/products/VendorComparison.tsx` | `"MamaLucica"` brand name | Read from `useEditableContent().store_general.store_name` |
| `vite.config.ts` | PWA manifest `"Mama Lucica"` | Keep as-is (build-time only, not runtime) |

### 3. Consolidate `useStoreBranding` → `useEditableContent`
`useStoreBranding` reads from `store_branding` key while `useEditableContent` reads from `editable_store_general`. This duplication causes confusion. Update `useStoreBranding` to delegate to `useEditableContent().store_general` so there's one source of truth.

### 4. Add "Inițializează" button in Admin Content Editor
A one-click button that upserts all 10 `editable_*` keys with their current defaults into `app_settings`, ensuring the database has the rows and Realtime can propagate changes.

## Files Modified

| File | Change |
|------|--------|
| `src/components/admin/settings/AdminEditableContent.tsx` | Add "Initialize Defaults" button |
| `src/hooks/useStoreBranding.tsx` | Delegate to `useEditableContent().store_general` |
| `src/pages/ProductDetail.tsx` | Replace hardcoded "MamaLucica" with dynamic store name |
| `src/pages/CmsPage.tsx` | Replace hardcoded "MamaLucica" with dynamic store name |
| `src/components/products/VendorComparison.tsx` | Replace hardcoded "MamaLucica" with dynamic store name |

## How It Works After Fix

1. Admin opens Content Editor → clicks "Inițializează Valori Default" (or just "Salvează Tot")
2. All 10 `editable_*` rows are written to `app_settings`
3. Realtime subscription fires → `useEditableContent` re-fetches → all components update instantly
4. Any future edit + save propagates in under 10 seconds

