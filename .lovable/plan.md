

## Fix sitemap.xml on Lovable Hosting

### Problem
`public/_redirects` is not supported by Lovable hosting, so `/sitemap.xml` returns a 404. The Edge Function generating the sitemap works fine — we just need a way to serve it at `/sitemap.xml`.

### Approach
Add a React route at `/sitemap.xml` that fetches the XML from the existing Edge Function and replaces the document content with raw XML. This reuses all the existing sitemap logic (products, categories, SEO pages, blog posts, CMS pages).

### Changes

**1. Create `src/pages/SitemapXml.tsx`**
- On mount, fetch XML from the Edge Function endpoint (`/functions/v1/sitemap` via the Supabase URL)
- Replace the entire document with the XML response using `document.open('text/xml')` / `document.write()` / `document.close()`
- Use `VITE_SUPABASE_URL` env var to build the Edge Function URL
- Show nothing while loading (return `null`)

**2. Update `src/App.tsx`**
- Import `SitemapXml`
- Add route: `<Route path="/sitemap.xml" element={<SitemapXml />} />`
- Place it before the catch-all `*` route

**3. Clean up `public/_redirects`**
- Remove the sitemap redirect line (no longer needed)

### Technical Notes
- This delegates all sitemap generation to the existing Edge Function — no logic duplication
- Google's crawler executes JavaScript, so the client-side XML rendering works for SEO indexing
- The base URL `https://www.mamalucica.ro` and all SEO programmatic pages are already handled by the Edge Function
- `robots.txt` already points to `https://www.mamalucica.ro/sitemap.xml` which will now resolve correctly

