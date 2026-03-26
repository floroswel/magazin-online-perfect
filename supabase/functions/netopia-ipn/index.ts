import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// NETOPIA error code descriptions
const ERROR_MESSAGES: Record<string, string> = {
  "16": "Cardul prezintă un risc de securitate",
  "17": "Număr card incorect",
  "18": "Card închis",
  "19": "Card expirat",
  "20": "Fonduri insuficiente",
  "21": "Cod CVV2 incorect",
  "35": "Tranzacție refuzată",
};

function mapActionToStatus(action: string, errorCode: string): string {
  if (action === "paid" && errorCode === "0") return "confirmed";
  if (action === "confirmed" && errorCode === "0") return "settled";
  if (action === "confirmed_pending" && errorCode === "0") return "processing";
  if (action === "paid_pending" && errorCode === "0") return "processing";
  if (action === "credit") return "refunded";
  if (action === "canceled" || errorCode !== "0") return "failed";
  return "pending";
}

function mapActionToOrderStatus(action: string, errorCode: string): string {
  if (action === "paid" && errorCode === "0") return "confirmed";
  if (action === "confirmed" && errorCode === "0") return "confirmed";
  if (action === "confirmed_pending" && errorCode === "0") return "pending_payment";
  if (action === "paid_pending" && errorCode === "0") return "pending_payment";
  if (action === "credit") return "refunded";
  return "payment_failed";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // NETOPIA sends form-urlencoded with env_key, data, cipher, iv
    const formData = await req.formData();
    const envKey = formData.get("env_key") as string;
    const data = formData.get("data") as string;
    const cipher = formData.get("cipher") as string;
    const iv = formData.get("iv") as string;

    if (!envKey || !data) {
      return new Response(
        buildMerchantResponse("1", "Missing required IPN fields"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // In production, decrypt data using merchant .key file from storage
    // For now, we parse assuming decrypted XML is available
    // The actual RSA decryption would require the merchant private key from storage
    // This is a placeholder for the decryption logic

    // Load settings to get key path
    const { data: settings } = await supabase
      .from("netopia_settings")
      .select("merchant_key_path")
      .limit(1)
      .maybeSingle();

    if (!settings?.merchant_key_path) {
      return new Response(
        buildMerchantResponse("1", "Merchant key not configured"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // NOTE: Full RSA decryption requires crypto libraries
    // In a production implementation, you would:
    // 1. Download the .key file from storage
    // 2. Use RSA to decrypt env_key → get symmetric key
    // 3. Use symmetric key (AES-256-CBC or RC4) to decrypt data
    // 4. Parse the resulting XML
    
    // For the IPN handler structure, we process the parsed XML fields:
    // This demonstrates the status handling logic
    // In production, extract these from decrypted XML
    const action = ""; // parsed from XML: order.mobilpay.@_attributes.action
    const errorCode = "0"; // parsed from XML
    const errorMessage = ""; // parsed from XML
    const orderId = ""; // parsed from XML: params → order_id
    const purchaseId = ""; // parsed from XML: order.mobilpay.@_attributes.id
    const originalAmount = 0; // parsed from XML
    const processedAmount = 0; // parsed from XML
    const panMasked = ""; // parsed from XML
    const tokenId = ""; // parsed from XML
    const crc = ""; // parsed from XML for response

    if (!orderId) {
      return new Response(
        buildMerchantResponse("1", "Missing order_id in IPN"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Check for idempotency — same order + same action = skip
    const { data: existingTx } = await supabase
      .from("netopia_transactions")
      .select("id, action, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingTx && existingTx.action === action) {
      // Already processed this action
      return new Response(
        buildMerchantResponse("0", "", crc),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    const newStatus = mapActionToStatus(action, errorCode);
    const now = new Date().toISOString();

    const txPayload = {
      order_id: orderId,
      netopia_purchase_id: purchaseId || null,
      action,
      error_code: errorCode,
      error_message: errorMessage || ERROR_MESSAGES[errorCode] || null,
      original_amount: originalAmount || null,
      processed_amount: processedAmount || null,
      pan_masked: panMasked || null,
      token_id: tokenId || null,
      status: newStatus,
      ipn_raw_xml: data, // store encrypted payload for debugging
      ipn_received_at: now,
      updated_at: now,
    };

    if (existingTx) {
      await supabase
        .from("netopia_transactions")
        .update(txPayload)
        .eq("id", existingTx.id);
    } else {
      await supabase
        .from("netopia_transactions")
        .insert({ ...txPayload, netopia_order_id: orderId });
    }

    // Update order status
    const orderStatus = mapActionToOrderStatus(action, errorCode);
    await supabase
      .from("orders")
      .update({
        status: orderStatus,
        payment_status: newStatus,
        updated_at: now,
      })
      .eq("id", orderId);

    return new Response(
      buildMerchantResponse("0", "", crc),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  } catch (err) {
    console.error("NETOPIA IPN error:", err);
    return new Response(
      buildMerchantResponse("1", "Internal server error"),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
});

function buildMerchantResponse(
  errorType: string,
  message: string,
  crc?: string
): string {
  if (errorType === "0") {
    return `<?xml version="1.0" encoding="utf-8"?><crc>${crc || ""}</crc>`;
  }
  return `<?xml version="1.0" encoding="utf-8"?><crc error_type="${errorType}" error_code="0">${message}</crc>`;
}
