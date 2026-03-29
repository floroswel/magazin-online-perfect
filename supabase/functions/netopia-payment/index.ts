import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sandbox mode — flip to false + swap URL for production
const SANDBOX_MODE = true;
const NETOPIA_BASE = SANDBOX_MODE
  ? "https://secure.sandbox.netopia-payments.com"
  : "https://secure.mobilpay.ro/pay";

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

    // ── Read credentials from payment_methods table ──
    const { data: pm, error: pmError } = await supabase
      .from("payment_methods")
      .select("config_json, sandbox_mode")
      .eq("key", "card_online")
      .eq("is_active", true)
      .single();

    if (pmError || !pm?.config_json) {
      console.error("payment_methods lookup error:", pmError);
      return new Response(
        JSON.stringify({ error: "Netopia not configured — payment method missing or inactive" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = pm.config_json as Record<string, string>;
    // Netopia V2 uses an API key for Authorization, stored as 'api_key' or 'merchant_id'
    const apiKey = config.api_key || config.merchant_id || "";
    const posSignature = config.pos_signature || config.merchant_id || "";

    if (!apiKey) {
      console.error("Netopia config missing api_key/merchant_id:", Object.keys(config));
      return new Response(
        JSON.stringify({ error: "Netopia API key not configured in payment method config_json. Required field: 'api_key' or 'merchant_id'" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch order ──
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shippingAddr = (order.shipping_address as Record<string, any>) || {};
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const confirmUrl = `${siteUrl}/order-confirmation/${orderId}`;
    const ipnUrl = `${supabaseUrl}/functions/v1/netopia-ipn`;

    // ── Build Netopia V2 Start Payment payload ──
    // Per https://doc.netopia-payments.com/docs/payment-api/v2.x/start/Resources/sample-request
    const netopiaPayload = {
      config: {
        emailTemplate: "",
        notifyUrl: ipnUrl,
        redirectUrl: confirmUrl,
        language: "ro",
      },
      payment: {
        options: { installments: 0, bonus: 0 },
        instrument: {
          type: "card",
          account: "",
          expMonth: 0,
          expYear: 0,
          secretCode: "",
          token: "",
        },
        data: {},
      },
      order: {
        ntpID: "",
        posSignature: posSignature,
        dateTime: new Date().toISOString(),
        description: `Comandă VENTUZA #${orderId.slice(0, 8)}`,
        orderID: orderId,
        amount: Number(order.total),
        currency: "RON",
        billing: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "",
          firstName: (shippingAddr.fullName || shippingAddr.full_name || "").split(" ")[0] || "Client",
          lastName: (shippingAddr.fullName || shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
          city: shippingAddr.city || "",
          country: 642,
          countryName: "Romania",
          state: shippingAddr.county || "",
          postalCode: shippingAddr.postalCode || shippingAddr.postal_code || "",
          details: shippingAddr.address || "",
        },
        shipping: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "",
          firstName: (shippingAddr.fullName || shippingAddr.full_name || "").split(" ")[0] || "Client",
          lastName: (shippingAddr.fullName || shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
          city: shippingAddr.city || "",
          country: 642,
          countryName: "Romania",
          state: shippingAddr.county || "",
          postalCode: shippingAddr.postalCode || shippingAddr.postal_code || "",
          details: shippingAddr.address || "",
        },
        products: [],
      },
    };

    console.log("Netopia V2 request URL:", `${NETOPIA_BASE}/payment/card/start`);
    console.log("Netopia V2 payload:", JSON.stringify(netopiaPayload));

    // ── Call Netopia V2 API ──
    const netopiaRes = await fetch(`${NETOPIA_BASE}/payment/card/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(netopiaPayload),
    });

    const responseText = await netopiaRes.text();
    console.log("Netopia V2 raw response status:", netopiaRes.status);
    console.log("Netopia V2 raw response:", responseText.slice(0, 2000));

    // Try to parse as JSON
    let netopiaData: any;
    try {
      netopiaData = JSON.parse(responseText);
    } catch {
      console.error("Netopia returned non-JSON response (likely wrong URL or auth):", responseText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Netopia returned invalid response. Check API key and endpoint configuration." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Netopia V2 parsed response:", JSON.stringify(netopiaData));

    // Check for errors
    if (netopiaData.error && netopiaData.error.code !== "0" && netopiaData.error.code !== 0 && netopiaData.error.code !== "100") {
      console.error("Netopia API error:", JSON.stringify(netopiaData.error));
      await supabase.from("orders").update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);

      return new Response(
        JSON.stringify({ error: netopiaData.error?.message || "Payment initiation failed", netopiaError: netopiaData.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Store transaction ──
    const ntpID = netopiaData.payment?.ntpID || null;
    await supabase.from("netopia_transactions").upsert({
      order_id: orderId,
      netopia_purchase_id: ntpID,
      action: "started",
      status: "pending",
      original_amount: order.total,
      updated_at: new Date().toISOString(),
    }, { onConflict: "order_id" });

    // ── Update order ──
    await supabase.from("orders").update({
      payment_status: "pending",
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    // ── Determine redirect URL ──
    // Netopia V2 can return:
    // 1. error.code=100 + payment.status=15 → 3DS redirect needed
    // 2. Direct payment URL
    let redirectUrl: string | null = null;

    if (netopiaData.error?.code === "100" || netopiaData.error?.code === 100) {
      // 3D Secure required — redirect to authentication URL
      redirectUrl = netopiaData.payment?.data?.AuthenticationUrl || 
                    netopiaData.payment?.paymentURL ||
                    null;
      console.log("3DS redirect URL:", redirectUrl);
    } else {
      redirectUrl = netopiaData.payment?.paymentURL || 
                    netopiaData.redirectUrl ||
                    null;
    }

    if (!redirectUrl) {
      console.error("No redirect URL in Netopia response:", JSON.stringify(netopiaData));
      return new Response(
        JSON.stringify({ 
          error: "Netopia did not return a payment redirect URL", 
          debug: { error: netopiaData.error, paymentStatus: netopiaData.payment?.status }
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ redirectUrl, ntpID }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Netopia payment error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
