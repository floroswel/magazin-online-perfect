# Mama Lucica — E2E Test Suite (Playwright)

Playwright specs covering the 5 critical flows. Run locally or in CI.

## Setup
```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Run
```bash
# All flows against the preview URL
PLAYWRIGHT_BASE_URL=https://your-emag-clone.lovable.app npx playwright test

# Single spec
npx playwright test e2e/checkout.spec.ts --headed
```

## Required env (CI)
- `PLAYWRIGHT_BASE_URL` — production or staging URL
- `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` — pre-seeded test customer
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` — pre-seeded admin user

## Coverage
| Spec | Flow | Critical assertions |
|---|---|---|
| `auth.spec.ts` | Login, logout, password reset link | Form validation, redirect to /cont, session persistence |
| `checkout.spec.ts` | Browse → add to cart → guest checkout → submit | Cart total math, address validation, order_number returned |
| `payment.spec.ts` | Card payment via Netopia (sandbox) | Redirect to gateway, return-URL handling, payment_status update |
| `return.spec.ts` | Return wizard for delivered order | Eligibility window, photo upload, return_request created |
| `admin-crud.spec.ts` | Admin login → create/edit/delete product | RLS protection, audit_log entry, realtime sync |

## Local fallback
If Playwright cannot run, the spec files document the expected flow as executable contracts.
The Vitest integration tests (`src/test/`) cover the same logic at unit level.
