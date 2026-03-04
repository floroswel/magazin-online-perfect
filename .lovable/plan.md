

# Plan: Implement Full-Text Search for Products

## Overview

Add PostgreSQL full-text search using `tsvector` + GIN index on the products table, plus `pg_trgm` for fuzzy/partial matching. Update the autocomplete dropdown to search across name, description, brand. Update the catalog page to use the same search. Add search term highlighting in autocomplete results.

## Database Migration

1. Enable `pg_trgm` extension
2. Add a generated `search_vector` column (tsvector) combining `name`, `description`, `brand`
3. Create a GIN index on the `search_vector` column
4. Create a GIN trigram index on `name` for partial/typo matching
5. Create a database function `search_products` that:
   - Uses `websearch_to_tsquery` for full-text ranking
   - Falls back to `pg_trgm` similarity for fuzzy matches
   - Joins categories table to also match by category name
   - Returns products with a relevance score
   - Accepts limit parameter

```sql
-- Enable pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector column
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED;

-- GIN indexes
CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Search function combining FTS + trigram
CREATE OR REPLACE FUNCTION search_products(search_term text, result_limit int DEFAULT 6)
RETURNS TABLE(id uuid, name text, slug text, price numeric, image_url text, brand text, category_name text, rank real)
...
```

## Frontend Changes

### `SearchAutocomplete.tsx`
- Call the `search_products` RPC function instead of `.ilike("name", ...)`
- Add highlight function that wraps matched terms in `<mark>` tags
- Use `dangerouslySetInnerHTML` or a safe highlight component for rendering
- Show category/brand info in results for context

### `Catalog.tsx`
- When `searchQuery` is present, use the `search_products` RPC to get matching product IDs, then fetch full products
- Or simpler: use `.or()` with `ilike` on name + description + brand for the catalog (keeps existing filter compatibility)
- Actually, best approach: use `.textSearch('search_vector', query)` for catalog filtering, which integrates with existing query builder

## Files to Modify
- `src/components/SearchAutocomplete.tsx` — use RPC, add highlighting
- `src/pages/Catalog.tsx` — use `textSearch` instead of `ilike` on name only

## Files to Create
- None (migration only + modify existing)

## Key Decisions
- Using `'simple'` text search config (language-agnostic, works for Romanian product names)
- Generated column ensures vector stays in sync automatically
- Trigram index on `name` provides fuzzy/partial matching for autocomplete
- The RPC function combines both FTS ranking and trigram similarity for best results
- Highlighting done client-side (safe, no HTML injection risk)

