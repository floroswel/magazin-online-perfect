

# Plan: Complete Transactional Email System with Resend

## Current State
- `send-email` edge function already exists with Resend integration and HTML templates for `order_placed`, `order_status`, `welcome`, `return_status`
- `RESEND_API_KEY` secret already configured
- Checkout already calls `send-email` after order placement (line 179 of Checkout.tsx)
- AdminOrders already sends `order_status` email when status changes (line 61 of AdminOrders.tsx)
- Sender is hardcoded as `"Magazin <onboarding@resend.dev>"` -- needs to be dynamic from `app_settings`
- No email logging exists in the database
- Shipping update email exists but doesn't include tracking info or delivery address

## Implementation Steps

### 1. Database Migration: Create `email_logs` table
```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  from_email text,
  subject text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  resend_id text,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email logs" ON email_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### 2. Rewrite `send-email` edge function
Key changes:
- Fetch `email_settings` from `app_settings` table using service role to get dynamic `from_email` and `from_name`
- Add `shipping_update` email type with tracking number, courier name, and delivery address in the template
- Enhance `order_placed` template to include delivery address
- Log every email sent (or failed) into the `email_logs` table
- Add `test` email type for the admin settings page test button

### 3. Enhance email templates
- **Order confirmation**: Add delivery address section, order items table with images reference, and store branding from settings
- **Shipping update** (new type `shipping_update`): Include AWB/tracking number, courier name, estimated delivery, and a tracking link
- **Order status**: Already works, just add delivery address context for shipped status

### 4. Update AdminOrders status change
- When status changes to `shipped`, pass additional data: `trackingNumber`, `courierName`, `shippingAddress` from the order record to the `send-email` call using `shipping_update` type instead of generic `order_status`

### 5. Admin Email Logs viewer
- Create `AdminEmailLogs.tsx` component showing sent emails in a table (recipient, type, subject, status, date)
- Add route in `AdminRoutes.tsx`

### 6. No changes needed for password reset
- Supabase Auth handles password reset emails natively; already configured and working via `ForgotPassword.tsx`

## Files to Create
- `src/components/admin/settings/AdminEmailLogs.tsx`

## Files to Modify
- `supabase/functions/send-email/index.ts` (major rewrite: dynamic sender, email logging, shipping template, test type)
- `src/components/admin/AdminOrders.tsx` (send `shipping_update` type when status = shipped)
- `src/components/admin/AdminRoutes.tsx` (add email logs route)

## Database Migration
- Create `email_logs` table with RLS for admin-only access

