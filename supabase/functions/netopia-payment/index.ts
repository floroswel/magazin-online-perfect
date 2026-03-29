import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SANDBOX_MODE = true;
const NETOPIA_URL = SANDBOX_MODE
  ? "https://sandboxsecure.mobilpay.ro"
  : "https://secure.mobilpay.ro";

/* ── Deno-safe helpers ─────────────────────────────── */

function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

/**
 * Convert PEM (PUBLIC KEY or CERTIFICATE) to raw DER ArrayBuffer.
 * Strips all headers/footers and whitespace, then base64-decodes.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Extract the SubjectPublicKeyInfo (SPKI) from an X.509 DER certificate.
 * X.509 structure: SEQUENCE { tbsCertificate SEQUENCE { ... subjectPublicKeyInfo SEQUENCE ... } ... }
 * We find the SPKI by parsing the ASN.1 TBS certificate fields.
 */
function extractSpkiFromCertDer(certDer: Uint8Array): Uint8Array {
  // Parse outer SEQUENCE
  let offset = 0;
  if (certDer[offset] !== 0x30) throw new Error("Not a valid DER certificate");
  const outerLen = readAsn1Length(certDer, offset + 1);
  offset = outerLen.nextOffset;

  // Parse tbsCertificate SEQUENCE
  if (certDer[offset] !== 0x30) throw new Error("Invalid TBS certificate");
  const tbsLen = readAsn1Length(certDer, offset + 1);
  const tbsStart = tbsLen.nextOffset;

  // Inside TBS: skip version (context [0]), serialNumber, signature, issuer, validity, subject
  let pos = tbsStart;

  // version — optional, context-specific [0]
  if (certDer[pos] === 0xa0) {
    const vLen = readAsn1Length(certDer, pos + 1);
    pos = vLen.nextOffset + vLen.length;
  }

  // serialNumber (INTEGER)
  pos = skipAsn1Element(certDer, pos);
  // signature (SEQUENCE)
  pos = skipAsn1Element(certDer, pos);
  // issuer (SEQUENCE)
  pos = skipAsn1Element(certDer, pos);
  // validity (SEQUENCE)
  pos = skipAsn1Element(certDer, pos);
  // subject (SEQUENCE)
  pos = skipAsn1Element(certDer, pos);

  // subjectPublicKeyInfo (SEQUENCE) — this is what we want
  const spkiTag = certDer[pos];
  if (spkiTag !== 0x30) throw new Error("Expected SPKI SEQUENCE at offset " + pos);
  const spkiLen = readAsn1Length(certDer, pos + 1);
  const totalSpkiLen = (spkiLen.nextOffset - pos) + spkiLen.length;
  return certDer.slice(pos, pos + totalSpkiLen);
}

function readAsn1Length(data: Uint8Array, offset: number): { length: number; nextOffset: number } {
  const first = data[offset];
  if (first < 0x80) {
    return { length: first, nextOffset: offset + 1 };
  }
  const numBytes = first & 0x7f;
  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | data[offset + 1 + i];
  }
  return { length, nextOffset: offset + 1 + numBytes };
}

function skipAsn1Element(data: Uint8Array, offset: number): number {
  const lenInfo = readAsn1Length(data, offset + 1);
  return lenInfo.nextOffset + lenInfo.length;
}

/* ── XML builder ───────────────────────────────────── */

function buildOrderXml(params: {
  orderId: string;
  timestamp: number;
  signature: string;
  returnUrl: string;
  confirmUrl: string;
  amount: number;
  currency: string;
  details: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  return `<?xml version="1.0" encoding="utf-8"?>
<order type="card" id="${esc(params.orderId)}" timestamp="${params.timestamp}">
  <signature>${esc(params.signature)}</signature>
  <url>
    <return>${esc(params.returnUrl)}</return>
    <confirm>${esc(params.confirmUrl)}</confirm>
  </url>
  <invoice currency="${esc(params.currency)}" amount="${params.amount.toFixed(2)}">
    <details><![CDATA[${params.details}]]></details>
    <contact_info>
      <billing type="person">
        <first_name><![CDATA[${params.firstName}]]></first_name>
        <last_name><![CDATA[${params.lastName}]]></last_name>
        <address><![CDATA[${params.address}]]></address>
        <email><![CDATA[${params.email}]]></email>
        <mobile_phone><![CDATA[${params.phone}]]></mobile_phone>
      </billing>
    </contact_info>
  </invoice>
  <ipn_cipher>aes-256-cbc</ipn_cipher>
</order>`;
}

/* ── Encryption (pure Web Crypto) ──────────────────── */

async function encryptForNetopia(
  publicKeyPem: string,
  xmlData: string
): Promise<{ envKey: string; envData: string }> {
  // 1. Generate random AES-256 key (32 bytes) and IV (16 bytes)
  const aesKeyRaw = new Uint8Array(32);
  crypto.getRandomValues(aesKeyRaw);
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);

  // 2. AES-256-CBC encrypt the XML
  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  const xmlBytes = utf8ToBytes(xmlData);
  const encryptedXml = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, xmlBytes)
  );

  // 3. Prepend IV to ciphertext (Netopia expects IV + ciphertext)
  const combined = concatUint8Arrays(iv, encryptedXml);

  // 4. Import public key — handle both "BEGIN PUBLIC KEY" (SPKI) and "BEGIN CERTIFICATE" (X.509)
  let spkiDer: ArrayBuffer;
  const isCertificate = publicKeyPem.includes("BEGIN CERTIFICATE");

  if (isCertificate) {
    // X.509 certificate → extract SPKI from the DER
    const certDer = new Uint8Array(pemToArrayBuffer(publicKeyPem));
    const spkiBytes = extractSpkiFromCertDer(certDer);
    spkiDer = spkiBytes.buffer.slice(spkiBytes.byteOffset, spkiBytes.byteOffset + spkiBytes.byteLength);
    console.log("Netopia: extracted SPKI from X.509 certificate, SPKI length:", spkiBytes.length);
  } else {
    spkiDer = pemToArrayBuffer(publicKeyPem);
    console.log("Netopia: using raw SPKI public key, DER length:", spkiDer.byteLength);
  }

  let rsaKey: CryptoKey;
  try {
    rsaKey = await crypto.subtle.importKey(
      "spki",
      spkiDer,
      { name: "RSA-OAEP", hash: "SHA-1" },
      false,
      ["encrypt"]
    );
  } catch (importErr) {
    console.error("PUBLIC_KEY_IMPORT_FAILED:", importErr);
    console.error("Key type:", isCertificate ? "X.509 CERTIFICATE" : "PUBLIC KEY",
      "PEM length:", publicKeyPem.length);
    throw new Error(
      `PUBLIC_KEY_IMPORT_FAILED: ${importErr instanceof Error ? importErr.message : String(importErr)}. ` +
      `Key type: ${isCertificate ? "X.509 CERTIFICATE" : "PUBLIC KEY"}`
    );
  }

  // 5. RSA-OAEP encrypt the AES key
  const encryptedKeyBuf = new Uint8Array(
    await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKey, aesKeyRaw)
  );

  return {
    envKey: bytesToBase64(encryptedKeyBuf),
    envData: bytesToBase64(combined),
  };
}

/* ── Main handler ──────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read credentials from payment_methods table
    const { data: pm, error: pmError } = await supabase
      .from("payment_methods")
      .select("config_json, sandbox_mode")
      .eq("key", "card_online")
      .eq("is_active", true)
      .single();

    if (pmError || !pm?.config_json) {
      console.error("payment_methods lookup error:", pmError);
      return new Response(
        JSON.stringify({ error: "Netopia nu este configurată" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = pm.config_json as Record<string, string>;
    const posSignature = config.pos_signature || config.merchant_id || "";
    const publicKey = config.public_key || "";

    if (!posSignature || !publicKey) {
      console.error("Netopia config incomplete. Keys present:", Object.keys(config));
      return new Response(
        JSON.stringify({ error: "Configurare Netopia incompletă" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Comanda nu a fost găsită" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shippingAddr = (order.shipping_address as Record<string, any>) || {};
    const siteUrl = Deno.env.get("SITE_URL") || "https://your-emag-clone.lovable.app";
    const returnUrl = `${siteUrl}/order-confirmation/${orderId}`;
    const confirmUrl = `${supabaseUrl}/functions/v1/netopia-ipn`;

    const fullName = shippingAddr.fullName || shippingAddr.full_name || "Client";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Client";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build the XML
    const xml = buildOrderXml({
      orderId,
      timestamp: Date.now(),
      signature: posSignature,
      returnUrl,
      confirmUrl,
      amount: Number(order.total),
      currency: "RON",
      details: `Comandă VENTUZA #${orderId.slice(0, 8)}`,
      firstName,
      lastName,
      address: shippingAddr.address || "",
      email: order.user_email || shippingAddr.email || "",
      phone: shippingAddr.phone || "",
    });

    console.log("Netopia XML built for order:", orderId);

    // Encrypt the XML using Web Crypto
    const { envKey, envData } = await encryptForNetopia(publicKey, xml);

    console.log("Netopia encryption OK. envKey length:", envKey.length, "envData length:", envData.length);

    // Store transaction record
    await supabase.from("netopia_transactions").upsert({
      order_id: orderId,
      action: "started",
      status: "pending",
      original_amount: order.total,
      updated_at: new Date().toISOString(),
    }, { onConflict: "order_id" });

    // Update order status
    await supabase.from("orders").update({
      payment_status: "pending",
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    // Return encrypted data for frontend form POST
    return new Response(
      JSON.stringify({
        envKey,
        data: envData,
        url: NETOPIA_URL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Netopia payment error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare internă server" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
