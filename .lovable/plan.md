

# Plan: Migrate products.brand from text to FK (brand_id)

## Overview

The `brands` table already exists with proper RLS policies. The task is to add a `brand_id` UUID FK column to `products`, migrate existing text brand values, update all code to use the FK relationship, and eventually drop the text column.

## Database Migration (single migration)

```sql
-- 1. Add brand_id column
ALTER TABLE public.products ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- 2. Migrate existing text brand values into brands table (dedup)
INSERT INTO public.brands (name, slug)
SELECT DISTINCT brand, 
  lower(regexp_replace(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
FROM public.products
WHERE brand IS NOT NULL AND brand != ''
  AND NOT EXISTS (SELECT 1 FROM public.brands b WHERE lower(b.name) = lower(products.brand))
ON CONFLICT (slug) DO NOTHING;

-- 3. Backfill brand_id from text match
UPDATE public.products p
SET brand_id = b.id
FROM public.brands b
WHERE lower(p.brand) = lower(b.name)
  AND p.brand IS NOT NULL AND p.brand != '';

-- 4. Update search_products function to join brands
CREATE OR REPLACE FUNCTION public.search_products(search_term text, result_limit integer DEFAULT 6)
RETURNS TABLE(id uuid, name text, slug text, price numeric, image_url text, brand text, category_name text, rank real)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  WITH fts AS (
    SELECT
      p.id, p.name, p.slug, p.price, p.image_url,
      br.name AS brand,
      c.name AS category_name,
      ts_rank(p.search_vector, websearch_to_tsquery('simple', search_term)) AS fts_rank,
      similarity(p.name, search_term) AS trgm_score
    FROM products p
    LEFT JOIN brands br ON br.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE
      p.search_vector @@ websearch_to_tsquery('simple', search_term)
      OR similarity(p.name, search_term) > 0.15
      OR p.name ILIKE '%' || search_term || '%'
      OR br.name ILIKE '%' || search_term || '%'
      OR c.name ILIKE '%' || search_term || '%'
  )
  SELECT fts.id, fts.name, fts.slug, fts.price, fts.image_url, fts.brand, fts.category_name,
    (fts.fts_rank * 2 + fts.trgm_score)::real AS rank
  FROM fts ORDER BY rank DESC LIMIT result_limit;
$$;

-- 5. Drop old text column (data is preserved in brands table + brand_id FK)
ALTER TABLE public.products DROP COLUMN brand;
```

## Files to Modify

### `src/pages/Catalog.tsx`
- Change brand filter from `.in("brand", selectedBrands)` to `.in("brand_id", selectedBrandIds)` where IDs come from the already-loaded `brands` state
- Update `selectedBrands` to store brand IDs instead of names
- Remove the `brand.ilike` from search `.or()` (brand is no longer a products column; search_products RPC handles it)
- Select with join: `.select("*, brands(name, logo_url)")` to get brand name for display

### `src/pages/ProductDetail.tsx`
- Change `product.brand` references to `product.brands?.name` (from FK join)
- Update JSON-LD brand output similarly

### `src/pages/Compare.tsx`
- Change `p.brand` to `p.brands?.name`

### `src/components/admin/AdminProducts.tsx`
- Replace text `brand` field in form with a `<Select>` dropdown populated from `brands` table
- Store `brand_id` instead of `brand` text
- Update product insert/update to use `brand_id`
- Update display columns to show `p.brands?.name`
- Update duplicate logic
- Add `.select("*, brands(name), categories(name)")` to product queries

### `src/components/admin/products/AdminBulkUpdate.tsx`
- Update select to include `brand_id` and join brands
- Display brand name from join

### `src/components/admin/products/AdminRelatedProducts.tsx`
- Update select and display to use `brands(name)` join

### `src/components/admin/products/AdminImportExport.tsx`
- CSV export: resolve brand name from join instead of text column
- CSV import: look up brand_id from brand name text

### `src/components/SearchAutocomplete.tsx`
- `search_products` RPC already returns `brand` as text (updated function joins brands table), so no change needed here

### `src/components/home/BrandCarousel.tsx`
- No change needed (already uses brands table directly)

### `supabase/functions/import-products/index.ts`
- After parsing brand text, look up or create brand in brands table, then set `brand_id` on the product instead of `brand`

### `supabase/functions/generate-description/index.ts`
- Accept `brand` as text parameter (no change needed; caller passes brand name)

## No data loss
- All unique brand text values are inserted into `brands` table before the FK is set
- `brand_id` is populated via case-insensitive match before dropping the text column
- Products without a brand get `brand_id = NULL`

