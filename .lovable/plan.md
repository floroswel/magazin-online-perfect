

## Plan: Diagnose Netopia V2 401 Unauthorized

The logs clearly show Netopia returning `{"code":"401","message":"Unauthorized"}`. The API key is present but rejected. We need to diagnose exactly what's being sent.

### Steps

1. **Add GET diagnostic handler** to `supabase/functions/netopia-payment/index.ts` — the exact code you provided, inserted at the top of `Deno.serve` before the OPTIONS check. This logs the API key length, preview, and raw Netopia response.

2. **Deploy and invoke** the function via GET to capture the exact Netopia response and API key metadata.

3. **Check logs** for `api_key_length`, `api_key_preview`, `netopia_status`, and `netopia_body`.

4. **Remove GET handler** after diagnosis.

### Root Cause Hypothesis

The 401 likely means one of:
- The `NETOPIA_API_KEY` secret value is wrong, expired, or has extra whitespace/quotes
- Netopia V2 expects a specific `Authorization` header format (e.g., `Bearer <key>` or a custom prefix) rather than just the raw key
- The POS signature doesn't match the API key's merchant account

### Technical Details

- File to edit: `supabase/functions/netopia-payment/index.ts`
- Insert the GET handler block at line ~13 (after CORS headers, before OPTIONS check)
- After deployment, invoke via `curl` or the edge function tools and read logs

