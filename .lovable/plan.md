

# Plan: Integrate Stripe as Real Payment Provider

## Overview

Add real Stripe payment processing using Stripe Checkout Sessions (redirect flow). When a user selects "Card online" and places an order, they'll be redirected to Stripe's hosted checkout page. A webhook edge function handles payment confirmation and updates the order in the database.

## Current State

- `Checkout.tsx` has a "card" payment method option but no real payment processing -- it just inserts the order directly
- `orders` table has `payment_status`, `payment_method`, `status` columns -- ready to use
- `profiles` table does NOT have a `stripe_customer_id` column -- needs migration
- Secrets already configured: `RESEND_API_KEY`, `MOKKA_API_KEY`, etc. -- need to add `STRIPE_SECRET_KEY`

## Implementation Steps

### 1. Add Stripe Secret Key
Use the `add_secret` tool to request `STRIPE_SECRET_KEY` from the user. Also store `STRIPE_WEBHOOK_SECRET` for webhook signature verification.

### 2. Database Migration
Add `stripe_customer_id` column to `profiles` table and `stripe_session_id` column to `orders` table for tracking.

```sql
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
ALTER TABLE orders ADD COLUMN stripe_session_id text;
```

### 3. Edge Function: `create-checkout-session`
- Receives: order ID, customer email, line items, success/cancel URLs
- Creates or retrieves Stripe Customer (stores `stripe_customer_id` on profile)
- Creates a Stripe Checkout Session in `payment` mode
- Updates order with `stripe_session_id`
- Returns the session URL for redirect

### 4. Edge Function: `stripe-webhook`
- `verify_jwt = false` (public endpoint for Stripe callbacks)
- Validates webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handles `checkout.session.completed`: updates order `payment_status` to `paid`, `status` to `processing`
- Handles `checkout.session.expired`: updates order `payment_status` to `failed`
- Triggers confirmation email via `send-email` function on success

### 5. Modify `Checkout.tsx`
- When `paymentMethod === "card"`: after creating the order (with `payment_status: 'pending'`), call `create-checkout-session` edge function and redirect to Stripe URL
- For non-card methods (ramburs, mokka, paypo): keep existing flow unchanged
- Do NOT clear cart until payment is confirmed (for card payments, clear on return to success page)

### 6. Add Payment Success/Cancel Pages
- `/checkout/success?session_id=...` -- verifies session, shows confirmation, clears cart
- `/checkout/cancel` -- shows "payment cancelled" message, links back to checkout

### 7. Update `supabase/config.toml`
Register new edge functions with `verify_jwt = false`.

## Files to Create
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/pages/CheckoutSuccess.tsx`
- `src/pages/CheckoutCancel.tsx`

## Files to Modify
- `src/pages/Checkout.tsx` -- split card flow to redirect to Stripe
- `src/App.tsx` -- add new routes
- `supabase/config.toml` -- register new functions

## Key Design Decisions
- Using Stripe Checkout (redirect) instead of embedded Payment Element -- simpler, PCI-compliant, no Stripe.js dependency on frontend
- Cart clearing for card payments happens on the success page, not at order creation
- Order is created first with `payment_status: 'pending'`, then Stripe session is created referencing it
- Webhook is the source of truth for payment confirmation (not the redirect)

