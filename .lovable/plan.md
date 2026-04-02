

# VERSION 7.0 — Add Missing Custom Fields to Admin Panel

## Current State

**Already implemented (VERSION 5.0/6.0):** All 9 content sections (Announcement, Header Topbar, Header Nav, Mobile Categories, Why Section, Process Section, Scent Promos, Trust Strip, Social Proof) are fully editable in Admin via `AdminEditableContent.tsx` and synced to storefront via `useEditableContent` + Supabase Realtime.

## What's Actually Missing

1. **General Settings fields** (`store_name`, `store_slogan`) — not in `useEditableContent`; currently only in `AdminHomepageSettings` branding but not connected to storefront components (SeoHead, Footer hardcode "MamaLucica")
2. **Add/Remove buttons** missing on Why items, Process steps, Trust badges, and Social Proof items (only Nav links, Categories, and Promos have add/remove)
3. **Textarea** should be used for longer text fields (announcement text, descriptions) instead of single-line Input
4. **Hardcoded "MamaLucica"** in SeoHead.tsx, Footer.tsx, ControlTheme.tsx preview — should read from editable content

## Changes

### 1. Extend `useEditableContent.tsx`
- Add `store_general` field: `{ store_name: string; store_slogan: string; store_email: string }`
- Add corresponding `editable_store_general` key to CONTENT_KEYS
- Default: `{ store_name: "MamaLucica", store_slogan: "Lumânări artizanale", store_email: "contact@mamalucica.ro" }`

### 2. Update `AdminEditableContent.tsx`
- Add 5th tab **"General"** with store_name, store_slogan, store_email fields
- Add **Plus/Trash buttons** on Why items, Process steps, Trust badges, Social Proof items
- Replace `Input` with `Textarea` for announcement text_desktop, text_mobile, and all `desc` fields

### 3. Connect `store_general` to storefront
- **SeoHead.tsx**: Read `store_general.store_name` from `useEditableContent()` instead of hardcoded "MamaLucica"
- **Footer.tsx**: Use `store_general.store_name` for copyright fallback

### Files Modified
| File | Change |
|------|--------|
| `src/hooks/useEditableContent.tsx` | Add `store_general` to interface, defaults, and key map |
| `src/components/admin/settings/AdminEditableContent.tsx` | Add General tab, add/remove on all lists, Textarea for long fields |
| `src/components/SeoHead.tsx` | Read store name from editable content |
| `src/components/layout/Footer.tsx` | Read store name from editable content |

