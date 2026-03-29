import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

function encryptForNetopia(
  publicKeyPem: string,
  xmlData: string
): { envKey: string; envData: string } {
  const aesKeyBytes = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);

  const cipher = forge.cipher.createCipher("AES-CBC", aesKeyBytes);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(xmlData, "utf8"));
  cipher.finish();
  const encryptedXml = cipher.output.getBytes();

  // IV prepended to ciphertext
  const combined = iv + encryptedXml;

  // Extract public key from certificate
  let publicKey: forge.pki.rsa.PublicKey;
  if (publicKeyPem.includes("CERTIFICATE")) {
    const cert = forge.pki.certificateFromPem(publicKeyPem);
    publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
  } else {
    publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  }

  // RSA PKCS1 v1.5 (NOT OAEP) — matches Netopia PHP SDK
  const encryptedKey = publicKey.encrypt(aesKeyBytes, "RSAES-PKCS1-V1_5");

  return {
    envKey: forge.util.encode64(encryptedKey),
    envData: forge.util.encode64(combined),
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

    // 1. Load config
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
    const isSandbox = config.sandbox === "true" || config.sandbox === true as any;
    const gatewayUrl = isSandbox
      ? (config.sandbox_url || "https://sandboxsecure.mobilpay.ro")
      : (config.live_url || "https://secure.mobilpay.ro");

    console.log("1. Config loaded - signature:", posSignature, "sandbox:", isSandbox, "url:", gatewayUrl);
    console.log("   public_key starts with:", publicKey.substring(0, 30));

    if (!posSignature || !publicKey) {
      console.error("Netopia config incomplete. Keys present:", Object.keys(config));
      return new Response(
        JSON.stringify({ error: "Configurare Netopia incompletă" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch order
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

    // 3. Build XML
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

    console.log("2. XML built - length:", xml.length);
    console.log("3. XML first 300 chars:", xml.substring(0, 300));

    // 4. Encrypt
    const { envKey, envData } = encryptForNetopia(publicKey, xml);

    console.log("4. Encryption done - envKey:", envKey.length, "data:", envData.length);
    console.log("5. Returning url:", gatewayUrl);

    // Store transaction
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

    return new Response(
      JSON.stringify({
        envKey,
        data: envData,
        url: gatewayUrl,
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
