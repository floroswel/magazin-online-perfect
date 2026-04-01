

## Plan: Create 4 Legal Pages + Footer Links

### Current State
- Legal pages are referenced via CMS routes (`/page/politica-de-confidentialitate`, `/page/termeni-si-conditii`, etc.)
- Cookie consent banner already exists (`CookieConsent.tsx`) and blocks GA4/Pixel until accepted via `useMarketingTracking.ts`
- Footer has hardcoded `col4Links` with some legal links pointing to CMS slugs

### What Will Be Built

**4 new page components** with full Romanian legal content specific to MamaLucica (lumânări artizanale):

1. **`src/pages/PoliticaConfidentialitate.tsx`** — GDPR-compliant privacy policy (data collection, processing, rights, DPO contact)
2. **`src/pages/TermeniSiConditii.tsx`** — Terms & conditions (purchase, payment, delivery, liability)
3. **`src/pages/PoliticaCookies.tsx`** — Cookie policy explaining cookie types; references existing consent banner (already functional)
4. **`src/pages/PoliticaRetur.tsx`** — 14-day return policy per OUG 34/2014

**Route registration** in `App.tsx`:
- `/politica-de-confidentialitate`
- `/termeni-si-conditii`
- `/politica-de-cookies`
- `/politica-de-retur`

**Footer update** — Replace `col4Links` in `Footer.tsx` to include all 4 legal page links with correct paths (no longer `/page/` prefix).

**Existing link updates** — Update references in `Auth.tsx`, `Checkout.tsx`, `Account.tsx`, `NewsletterPopup.tsx`, and `AdminFooterSettings.tsx` to point to the new direct routes instead of CMS routes.

### Technical Notes
- Cookie consent blocking is already implemented — `CookieConsent.tsx` dispatches `gdpr-consent` events, and `useMarketingTracking.ts` only loads GA4/Pixel after consent. No changes needed to that logic.
- Pages use the existing `Layout` component wrapper with `prose` styling for content.
- All content in Romanian, referencing "MamaLucica", "contact@mamalucica.ro", Romanian legislation.

