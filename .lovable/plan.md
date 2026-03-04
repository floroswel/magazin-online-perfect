

# Plan: Connect Multi-Currency to Storefront

## Problem
The `useCurrency` hook already exists with `format()`, `convert()`, localStorage persistence, and DB-backed exchange rates. But **no storefront component actually uses it** — they all hardcode `{price.toLocaleString("ro-RO")} lei`.

## Approach
Replace every hardcoded price display with `useCurrency().format(price)` in storefront components. The hook already handles conversion and symbol formatting.

## Files to Modify

### Storefront price displays (replace `X.toLocaleString("ro-RO")} lei` with `format(X)`):

| File | Instances |
|---|---|
| `src/components/products/ProductCard.tsx` | price, old_price |
| `src/pages/ProductDetail.tsx` | activePrice, old_price, mobile sticky price, JSON-LD priceCurrency |
| `src/pages/Cart.tsx` | item price, line total, subtotal, shipping, total |
| `src/pages/Checkout.tsx` | item totals, coupon discount, loyalty discount, shipping, total, installment amounts, coupon toast |
| `src/pages/Compare.tsx` | price, old_price |
| `src/components/home/FlashDeals.tsx` | if it displays prices |
| `src/components/home/BestSellers.tsx` | if it displays prices |
| `src/components/mokka/MokkaOrangePrice.tsx` | installment price display |

### Checkout — pass currency to order data
- Store `currency` and `currency_rate` on the order record so the backend knows the original currency
- For Stripe (future): the currency code from `useCurrency()` will be passed to the checkout session

### JSON-LD in ProductDetail
- Change hardcoded `priceCurrency: "RON"` to use `currency` from the hook, and `price` to `convert(product.price)`

## No changes to
- `useCurrency.tsx` (already complete)
- `LocaleSwitcher.tsx` (already wired)
- Admin pages (admin always shows RON internally)
- `useCurrency` provider or DB config

## Key Details
- Each component imports `useCurrency` and destructures `format` (and `currency`/`convert` where needed)
- `format()` handles conversion + symbol automatically
- Cart/Checkout totals are computed from RON prices, then formatted via `format()` at display time
- The order is still stored in RON in the database (source of truth), with the display currency noted

