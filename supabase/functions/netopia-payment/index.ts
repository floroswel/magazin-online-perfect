import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto as stdCrypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SANDBOX_MODE = true;
const NETOPIA_URL = SANDBOX_MODE
  ? "https://sandboxsecure.mobilpay.ro"
  : "https://secure.mobilpay.ro";

/**
 * Build XML from the Netopia order data structure.
 * Matches the official mobilpay XML schema exactly.
 */
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
  // Escape XML special characters
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

/**
 * Encrypt data using AES-256-CBC, then encrypt the AES key with RSA public key.
 * This matches the official Netopia Node.js SDK encrypt() function exactly.
 */
async function encryptForNetopia(
  publicKeyPem: string,
  xmlData: string
): Promise<{ envKey: string; envData: string }> {
  // Generate random 32-byte AES key and 16-byte IV
  const aesKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // AES-256-CBC encrypt the XML data
  const aesImportedKey = await crypto.subtle.importKey(
    "raw",
    aesKey,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(xmlData);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    aesImportedKey,
    encoded
  );

  // Combine IV + encrypted data (Netopia expects IV prepended)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // RSA encrypt the AES key using the public certificate
  const rsaKey = await importPublicKey(publicKeyPem);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaKey,
    aesKey
  );

  return {
    envKey: base64Encode(new Uint8Array(encryptedKey)),
    envData: base64Encode(combined),
  };
}

/**
 * Import a PEM-encoded X.509 certificate's public key for RSA encryption.
 */
async function importPublicKey(pem: string): Promise<CryptoKey> {
  // Handle both certificate and raw public key formats
  let cleanPem = pem.trim();
  
  let derBytes: Uint8Array;
  
  if (cleanPem.includes("BEGIN CERTIFICATE")) {
    // X.509 certificate — extract public key using SubjectPublicKeyInfo
    const b64 = cleanPem
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s/g, "");
    
    const certDer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    
    // Parse X.509 certificate to extract SubjectPublicKeyInfo
    derBytes = extractPublicKeyFromCert(certDer);
  } else if (cleanPem.includes("BEGIN PUBLIC KEY")) {
    const b64 = cleanPem
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s/g, "");
    derBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } else {
    throw new Error("Unsupported key format. Expected PEM certificate or public key.");
  }

  return crypto.subtle.importKey(
    "spki",
    derBytes,
    { name: "RSA-OAEP", hash: "SHA-1" },
    false,
    ["encrypt"]
  );
}

/**
 * Extract SubjectPublicKeyInfo from a DER-encoded X.509 certificate.
 * Simple ASN.1 parser — walks the certificate structure to find the public key.
 */
function extractPublicKeyFromCert(certDer: Uint8Array): Uint8Array {
  // ASN.1 DER parsing helpers
  let offset = 0;

  function readTag(): number {
    return certDer[offset++];
  }

  function readLength(): number {
    let len = certDer[offset++];
    if (len & 0x80) {
      const numBytes = len & 0x7f;
      len = 0;
      for (let i = 0; i < numBytes; i++) {
        len = (len << 8) | certDer[offset++];
      }
    }
    return len;
  }

  function readSequence(): { start: number; length: number } {
    const tag = readTag();
    if ((tag & 0x1f) !== 0x10) {
      throw new Error(`Expected SEQUENCE tag (0x30), got 0x${tag.toString(16)}`);
    }
    const length = readLength();
    return { start: offset, length };
  }

  // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
  readSequence(); // outer SEQUENCE
  const tbs = readSequence(); // tbsCertificate SEQUENCE

  // TBSCertificate fields:
  // version [0] EXPLICIT (optional), serialNumber, signature, issuer, validity, subject, subjectPublicKeyInfo
  const savedOffset = offset;

  // Check if version is present (context tag [0])
  if (certDer[offset] === 0xa0) {
    offset++; // tag
    const vLen = readLength();
    offset += vLen; // skip version
  }

  // serialNumber (INTEGER)
  readTag();
  offset += readLength();

  // signature (SEQUENCE)
  readTag();
  let sLen = readLength();
  offset += sLen;

  // issuer (SEQUENCE)
  readTag();
  sLen = readLength();
  offset += sLen;

  // validity (SEQUENCE)
  readTag();
  sLen = readLength();
  offset += sLen;

  // subject (SEQUENCE)
  readTag();
  sLen = readLength();
  offset += sLen;

  // subjectPublicKeyInfo (SEQUENCE) — this is what we want
  const spkiStart = offset;
  readTag(); // SEQUENCE tag
  const spkiContentLen = readLength();
  const spkiTotalLen = offset - spkiStart + spkiContentLen;

  return certDer.slice(spkiStart, spkiStart + spkiTotalLen);
}

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
        JSON.stringify({ error: "Netopia nu este configurată — metoda de plată lipsește sau este inactivă" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = pm.config_json as Record<string, string>;
    const posSignature = config.pos_signature || config.merchant_id || "";
    const publicKey = config.public_key || "";
    const privateKey = config.private_key || "";

    if (!posSignature) {
      console.error("Netopia config missing pos_signature:", Object.keys(config));
      return new Response(
        JSON.stringify({ error: "Configurare Netopia incompletă: lipsește pos_signature" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!publicKey) {
      console.error("Netopia config missing public_key");
      return new Response(
        JSON.stringify({ error: "Configurare Netopia incompletă: lipsește certificatul public (public_key)" }),
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
    console.log("XML content:", xml.slice(0, 500));

    // Encrypt the XML
    const { envKey, envData } = await encryptForNetopia(publicKey, xml);

    console.log("Netopia encryption successful. envKey length:", envKey.length, "envData length:", envData.length);

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

    // Return the encrypted data for the frontend to submit as a form
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
