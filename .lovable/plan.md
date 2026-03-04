

# Remove Unused Components

## Findings

Searched all `.tsx` and `.ts` files (excluding build artifacts) for import references:

- **`src/components/admin/AdminPlaceholder.tsx`** — zero imports anywhere. Only self-references in its own file.
- **`src/components/NavLink.tsx`** — zero imports anywhere. Only self-references in its own file.

All other components I checked (`CookieConsent`, `LocaleSwitcher`, `MokkaBanner`, `MokkaModal`, `MokkaOrangePrice`, `RecentlyViewed`, `VariantSelector`, `sanitize-json-ld`, `useLoyalty`, `useComparison`, etc.) are actively imported and used.

## Changes

### Delete 2 files
1. `src/components/admin/AdminPlaceholder.tsx` — unused placeholder component
2. `src/components/NavLink.tsx` — unused NavLink wrapper component

No other code changes needed since nothing imports these files.

