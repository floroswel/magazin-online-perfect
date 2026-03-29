import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Decrypt Netopia IPN data using AES-256-CBC with RSA-encrypted key.
 * Mirrors the official Node.js SDK decrypt() function.
 */
async function decryptNetopiaIpn(
  privateKeyPem: string,
  envKeyB64: string,
  dataB64: string
): Promise<string> {
  const envKeyBytes = base64Decode(envKeyB64);
  const dataBytes = base64Decode(dataB64);

  // RSA decrypt the AES key using private key
  const rsaKey = await importPrivateKey(privateKeyPem);
  const aesKeyBytes = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaKey,
    envKeyBytes
  );

  // Extract IV (first 16 bytes) and ciphertext from data
  const iv = dataBytes.slice(0, 16);
  const ciphertext = dataBytes.slice(16);

  // AES-256-CBC decrypt
  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Import a PEM-encoded RSA private key for decryption.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const derBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  // Try PKCS#8 first, fall back to pkcs8 wrapped
  const format = pem.includes("BEGIN RSA PRIVATE KEY") ? "pkcs8" : "pkcs8";

  try {
    return await crypto.subtle.importKey(
      format,
      derBytes,
      { name: "RSA-OAEP", hash: "SHA-1" },
      false,
      ["decrypt"]
    );
  } catch {
    // If PKCS#1 format, wrap in PKCS#8
    const pkcs8Der = wrapPkcs1InPkcs8(derBytes);
    return crypto.subtle.importKey(
      "pkcs8",
      pkcs8Der,
      { name: "RSA-OAEP", hash: "SHA-1" },
      false,
      ["decrypt"]
    );
  }
}

/**
 * Wrap a PKCS#1 RSA private key in PKCS#8 format.
 */
function wrapPkcs1InPkcs8(pkcs1Der: Uint8Array): Uint8Array {
  // PKCS#8 header for RSA
  const header = new Uint8Array([
    0x30, 0x82, 0x00, 0x00, // SEQUENCE (length placeholder)
    0x02, 0x01, 0x00,       // INTEGER 0 (version)
    0x30, 0x0d,             // SEQUENCE
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID rsaEncryption
    0x05, 0x00,             // NULL
    0x04, 0x82, 0x00, 0x00, // OCTET STRING (length placeholder)
  ]);

  const totalLen = header.length - 4 + pkcs1Der.length;
  const octetLen = pkcs1Der.length;

  const result = new Uint8Array(4 + totalLen);
  result.set(header);
  result.set(pkcs1Der, header.length);

  // Fix SEQUENCE length
  result[2] = (totalLen >> 8) & 0xff;
  result[3] = totalLen & 0xff;

  // Fix OCTET STRING length
  result[header.length - 2] = (octetLen >> 8) & 0xff;
  result[header.length - 1] = octetLen & 0xff;

  return result;
}

/**
 * Simple XML text extractor — gets the text content of a named element.
 */
function xmlText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([^<]*?)(?:\\]\\]>)?</${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() || "";
}

/**
 * Extract attribute from an XML element.
 */
function xmlAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match?.[1] || "";
}

/**
 * Map Netopia mobilPay action to order/payment status.
 */
function mapMobilPayAction(action: string): { orderStatus: string; paymentStatus: string } {
  switch (action) {
    case "confirmed":
      return { orderStatus: "confirmed", paymentStatus: "confirmed" };
    case "confirmed_pending":
      return { orderStatus: "pending_payment", paymentStatus: "pending" };
    case "paid_pending":
      return { orderStatus: "pending_payment", paymentStatus: "pending" };
    case "paid":
      return { orderStatus: "confirmed", paymentStatus: "paid" };
    case "canceled":
      return { orderStatus: "cancelled", paymentStatus: "cancelled" };
    case "credit":
      return { orderStatus: "refunded", paymentStatus: "refunded" };
    default:
      return { orderStatus: "pending_payment", paymentStatus: "pending" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Netopia posts form data with env_key and data fields
    let envKey = "";
    let encData = "";

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("form")) {
      const formData = await req.formData();
      envKey = (formData.get("env_key") as string) || "";
      encData = (formData.get("data") as string) || "";
    } else {
      // Try JSON fallback
      const body = await req.json();
      envKey = body.env_key || "";
      encData = body.data || "";
    }

    if (!envKey || !encData) {
      console.error("IPN missing env_key or data");
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="1">Missing env_key or data</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    console.log("Netopia IPN received. env_key length:", envKey.length, "data length:", encData.length);

    // Read private key from payment_methods
    const { data: pm, error: pmError } = await supabase
      .from("payment_methods")
      .select("config_json")
      .eq("key", "card_online")
      .eq("is_active", true)
      .single();

    if (pmError || !pm?.config_json) {
      console.error("Cannot read payment config for IPN:", pmError);
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="2">Payment config not found</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    const config = pm.config_json as Record<string, string>;
    const privateKey = config.private_key || "";

    if (!privateKey) {
      console.error("Netopia private_key missing from config");
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="3">Private key not configured</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Decrypt the IPN data
    let xml: string;
    try {
      xml = await decryptNetopiaIpn(privateKey, envKey, encData);
    } catch (decryptErr) {
      console.error("IPN decryption failed:", decryptErr);
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="4">Decryption failed</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    console.log("Decrypted IPN XML:", xml.slice(0, 2000));

    // Parse the XML to extract payment info
    const orderId = xmlAttr(xml, "order", "id");
    const action = xmlAttr(xml, "mobilpay", "action") || xmlAttr(xml, "action", "type") || xmlText(xml, "action");
    const errorCode = xmlAttr(xml, "error", "code") || xmlText(xml, "error_code");
    const errorMessage = xmlText(xml, "message") || xmlText(xml, "error");

    // Try alternative parsing if action not found
    let paymentAction = action;
    if (!paymentAction) {
      // Look for <mobilpay> element with action attribute
      const mobilpayMatch = xml.match(/<mobilpay[^>]*>/i);
      if (mobilpayMatch) {
        const actionMatch = mobilpayMatch[0].match(/action="([^"]*)"/);
        paymentAction = actionMatch?.[1] || "";
      }
    }

    // Also check for order_type/action in the standard IPN format
    if (!paymentAction) {
      const actionTypeMatch = xml.match(/<action[^>]*>([^<]*)<\/action>/i);
      paymentAction = actionTypeMatch?.[1]?.trim() || "unknown";
    }

    console.log("IPN parsed — orderId:", orderId, "action:", paymentAction, "errorCode:", errorCode, "errorMessage:", errorMessage);

    if (!orderId) {
      console.error("IPN missing order ID in XML");
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="5">Missing order ID</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    const { orderStatus, paymentStatus } = mapMobilPayAction(paymentAction);
    const now = new Date().toISOString();

    // Check idempotency
    const { data: existingTx } = await supabase
      .from("netopia_transactions")
      .select("id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingTx && existingTx.status === paymentStatus) {
      console.log("IPN already processed for order:", orderId);
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><crc>0</crc>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Update or insert transaction
    const txPayload = {
      order_id: orderId,
      action: paymentAction,
      error_code: errorCode || "0",
      error_message: errorMessage || null,
      status: paymentStatus,
      ipn_raw_xml: xml,
      ipn_received_at: now,
      updated_at: now,
    };

    if (existingTx) {
      await supabase.from("netopia_transactions").update(txPayload).eq("id", existingTx.id);
    } else {
      await supabase.from("netopia_transactions").insert({ ...txPayload, netopia_order_id: orderId });
    }

    // Update order status
    await supabase.from("orders").update({
      status: orderStatus,
      payment_status: paymentStatus,
      updated_at: now,
    }).eq("id", orderId);

    console.log("IPN processed — order:", orderId, "status:", orderStatus, "payment:", paymentStatus);

    // Send confirmation email on successful payment
    if (orderStatus === "confirmed") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*, order_items(*, products(name, price, image_url))")
          .eq("id", orderId)
          .single();

        if (order?.user_email) {
          const shippingAddr = (order.shipping_address as any) || {};
          await supabase.functions.invoke("send-email", {
            body: {
              type: "order_placed",
              to: order.user_email,
              data: {
                orderId: order.id,
                customerName: shippingAddr.fullName || shippingAddr.full_name || "Client",
                total: order.total,
                paymentMethod: "card_online",
                items: (order.order_items || []).map((i: any) => ({
                  name: i.products?.name || "Produs",
                  quantity: i.quantity,
                  price: i.price || i.products?.price,
                  image_url: i.products?.image_url,
                })),
                shippingAddress: shippingAddr,
              },
            },
          });

          // Admin notification
          await supabase.functions.invoke("send-email", {
            body: {
              type: "admin_new_order",
              to: "admin@ventuza.ro",
              data: {
                orderId: order.id,
                customerName: shippingAddr.fullName || shippingAddr.full_name || "Client",
                total: order.total,
                paymentMethod: "card_online",
                email: order.user_email,
                items: (order.order_items || []).map((i: any) => ({
                  name: i.products?.name || "Produs",
                  quantity: i.quantity,
                  price: i.price || i.products?.price,
                })),
                shippingAddress: shippingAddr,
              },
            },
          });
        }
      } catch (emailErr) {
        console.error("IPN email notification failed:", emailErr);
      }
    }

    // Respond with success XML — Netopia expects this format
    return new Response(
      `<?xml version="1.0" encoding="utf-8"?><crc>0</crc>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  } catch (err) {
    console.error("NETOPIA IPN error:", err);
    return new Response(
      `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="99">${err instanceof Error ? err.message : "Internal error"}</crc>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
});
