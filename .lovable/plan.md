

# VERSION 9.0 — External Webhooks Integration

## Overview

Add a complete "External Webhooks" system allowing users to configure outgoing webhooks that fire on store events (order.created, order.paid, etc.) and send payloads to external URLs like Zapier, Make.com, or custom CRMs.

## Current State

- **Existing `AdminWebhooks`** at `/admin/shipping/webhooks` manages **incoming** courier tracking webhooks only (Fan Courier, Sameday, etc.)
- **`webhook_queue`** table exists but is designed for incoming courier payloads
- No `external_webhooks` or `webhook_endpoints` table exists for user-configured outgoing webhooks

## Changes

### 1. New Database Table: `external_webhooks`

```sql
CREATE TABLE public.external_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_key TEXT,
  enabled BOOLEAN DEFAULT true,
  include_payload BOOLEAN DEFAULT true,
  custom_headers JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMPTZ,
  last_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage external webhooks"
  ON public.external_webhooks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### 2. New Edge Function: `dispatch-webhook`

- Accepts `{ event_type, payload }` via POST
- Queries `external_webhooks` for matching enabled endpoints
- For each match: sends POST with HMAC-SHA256 signature header, logs result
- Updates `last_triggered_at` and `last_status`
- Logs to `webhook_queue` as `direction: 'outgoing'`
- Includes retry logic (up to 3 attempts with exponential backoff)

### 3. New Admin UI: `AdminExternalWebhooks.tsx`

Located at `/admin/integrations/external-webhooks`, accessible from sidebar under "Integrări".

Features:
- List all configured webhooks with name, event, URL, enabled toggle, last status
- Add/Edit dialog with fields: name, event_type (dropdown), url, secret_key, include_payload, custom_headers (JSON textarea)
- Event type options: `order.created`, `order.paid`, `order.shipped`, `order.cancelled`, `product.updated`, `customer.created`, `newsletter.subscribed`, `custom_event`
- **"Send Test Webhook"** button per endpoint — sends a sample payload to the URL
- Delete with confirmation
- Recent delivery log (from `webhook_queue` filtered by outgoing + URL)

### 4. Trigger Webhooks from Existing Flows

Add `dispatchWebhook(eventType, payload)` helper in a shared util that calls the edge function. Integrate into:
- **Order creation** → `order.created`
- **Order status changes** → `order.paid`, `order.shipped`, `order.cancelled`

This is done via a lightweight client-side call after the DB operation succeeds.

### 5. Sidebar & Routing

- Add route: `/admin/integrations/external-webhooks` → `AdminExternalWebhooks`
- Add sidebar entry under Integrări: "Webhooks Externe" with Webhook icon

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `external_webhooks` table + RLS |
| `supabase/functions/dispatch-webhook/index.ts` | New edge function |
| `src/components/admin/integrations/AdminExternalWebhooks.tsx` | New admin UI |
| `src/lib/dispatchWebhook.ts` | Client helper to invoke the edge function |
| `src/components/admin/AdminRoutes.tsx` | Add route |
| `src/components/admin/AdminSidebar.tsx` | Add menu item |

