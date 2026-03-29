
Goal: eliminate the Deno runtime crash (`Buffer is not defined`) in `netopia-payment`, keep official Netopia XML + POST flow, and verify successful sandbox handoff.

1) Rewrite `netopia-payment` crypto layer to pure Deno/Web APIs
- File: `supabase/functions/netopia-payment/index.ts`
- Remove all Node-only imports (`node:crypto`) and all `Buffer` usage.
- Rewrite `encryptForNetopia` as `async` using only:
  - `crypto.getRandomValues()` for AES key (32 bytes) + IV (16 bytes)
  - `crypto.subtle.importKey("raw", ...)` + `crypto.subtle.encrypt({ name: "AES-CBC", iv }, ...)`
  - `crypto.subtle.importKey("spki", ...)` + `crypto.subtle.encrypt({ name: "RSA-OAEP" }, ...)` for encrypting AES key
- Add Deno-safe helpers:
  - `pemToArrayBuffer(pem)` (strip PEM headers, base64 decode via `atob`, return `ArrayBuffer`)
  - `utf8ToBytes` / `bytesToBase64`
  - `concatUint8Arrays(a, b)` for IV + ciphertext merge
- Keep XML generation unchanged in structure (template string, no binary APIs).

2) Harden key-format handling (critical to avoid next cryptography failure)
- Keep PEM normalization helper (`fixPem`) and support both `BEGIN PUBLIC KEY` and `BEGIN CERTIFICATE`.
- If key import fails, return explicit config/format error with clear stage (`PUBLIC_KEY_IMPORT_FAILED`) instead of generic 500.
- Do not log raw key material; log only key type + length.

3) Keep credential source and sandbox behavior aligned with current schema
- Continue reading from `payment_methods.config_json` for active `card_online` row (`key = 'card_online'` in current schema).
- Validate required fields:
  - `pos_signature` (fallback `merchant_id`)
  - `public_key`
  - `private_key` presence check for operational completeness (even if payment init only uses public key)
- Keep sandbox endpoint fixed to `https://sandboxsecure.mobilpay.ro`.

4) Keep frontend redirect contract intact (only minimal hardening if needed)
- File: `src/pages/Checkout.tsx`
- Preserve existing official POST form flow (`env_key`, `data`, `url`).
- Ensure error branch always stops submission and surfaces backend message; success branch only submits when all fields exist.

5) Verification plan after implementation
- Deploy updated function.
- Trigger `netopia-payment` on a real pending order via function call and confirm response contains:
  - `envKey` (base64)
  - `data` (base64)
  - `url === "https://sandboxsecure.mobilpay.ro"`
- Check latest `netopia-payment` logs:
  - No `Buffer is not defined`
  - No Node import/runtime errors
  - Encryption stage logs pass
- End-to-end checkout test:
  - Select “Card Online”
  - Confirm browser performs POST handoff to `sandboxsecure.mobilpay.ro` (not direct order confirmation fallback).

Technical details
- Crypto sequence implemented:
  1) XML string → UTF-8 bytes
  2) AES-256-CBC encrypt XML
  3) Prefix IV to ciphertext
  4) RSA-OAEP encrypt AES key with imported SPKI public key
  5) Base64 encode both payloads for Netopia fields
- If certificate import is still incompatible (some `.cer` files are full X.509 cert chains, not bare SPKI), the function will emit a specific format error so we can either:
  - convert stored key to `BEGIN PUBLIC KEY` (SPKI), or
  - add an in-function certificate-to-SPKI extraction path in a second pass.
