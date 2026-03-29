import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { publicEncrypt, createCipheriv, constants as cryptoConstants } from "node:crypto";
import { randomBytes } from "node:crypto";

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
 * Fix PEM formatting — DB may store with spaces instead of newlines.
 */
function fixPem(pem: string): string {
  // If it already has proper newlines, return as-is
  if (pem.includes("\n")) return pem.trim();
  
  // Replace space-separated base64 blocks with newline-separated
  return pem
    .replace(/(-----BEGIN [^-]+-----)\s+/, "$1\n")
    .replace(/\s+(-----END [^-]+-----)/, "\n$1")
    .replace(/(.{64})\s/g, "$1\n")
    .trim();
}

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
 * Encrypt data using AES-256-CBC, then encrypt AES key with RSA public cert.
 * Uses node:crypto which handles X.509 certificates natively (like official SDK).
 * Padding: RSA_PKCS1_PADDING (matching Netopia SDK exactly).
 */
function encryptForNetopia(
  publicKeyPem: string,
  xmlData: string
): { envKey: string; envData: string } {
  const fixedPem = fixPem(publicKeyPem);
  
  // Generate random 32-byte AES key and 16-byte IV
  const aesKey = randomBytes(32);
  const iv = randomBytes(16);

  // AES-256-CBC encrypt the XML
  const cipher = createCipheriv("aes-256-cbc", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(xmlData, "utf8"), cipher.final()]);

  // Prepend IV to encrypted data (Netopia expects IV + ciphertext)
  const combined = Buffer.concat([iv, encrypted]);

  // RSA encrypt the AES key using the public certificate
  // Using PKCS1 padding as per Netopia SDK
  const encryptedKey = publicEncrypt(
    {
      key: fixedPem,
      padding: cryptoConstants.RSA_PKCS1_PADDING,
    },
    aesKey
  );

  return {
    envKey: encodeBase64(encryptedKey),
    envData: encodeBase64(combined),
  };
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

    // Encrypt the XML using node:crypto
    const { envKey, envData } = encryptForNetopia(publicKey, xml);

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
