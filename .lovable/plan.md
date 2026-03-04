

# Fix Duplicate Abandoned Carts Route

## Problem
The `AdminAbandonedCarts` component is mounted at two different routes:
- `customers/abandoned` (used by sidebar under Customers)
- `marketing/abandoned-cart` (used by sidebar under Marketing)

Both render the same component. The sidebar has two separate links pointing to each.

## Decision
Keep `customers/abandoned` as the canonical route (it's the primary location — abandoned carts are customer data). The marketing sidebar entry at `marketing/abandoned-cart` is the duplicate.

## Changes

### `src/components/admin/AdminRoutes.tsx`
- Remove the route `<Route path="marketing/abandoned-cart" element={<AdminAbandonedCarts />} />` (line 207)

### `src/components/admin/AdminSidebar.tsx`
- Change the marketing sidebar item `{ label: "Coș abandonat", path: "/admin/marketing/abandoned-cart" }` (line 118) to point to `"/admin/customers/abandoned"` instead

This keeps both sidebar links functional (marketing users can still find it) but both point to the single canonical route. No changes to the abandoned carts page itself.

