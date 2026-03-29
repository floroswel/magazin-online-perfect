import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sandbox mode — flip to false + swap certs for production
const SANDBOX_MODE = true;
const NETOPIA_BASE = SANDBOX_MODE
  ? "https://sandboxsecure.mobilpay.ro"
  : "https://secure.mobilpay.ro";

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

    // Read secrets
    const signature = Deno.env.get("NETOPIA_SIGNATURE") || "";
    const publicKeyPem = Deno.env.get("NETOPIA_PUBLIC_KEY") || "";
    const _privateKeyPem = Deno.env.get("NETOPIA_PRIVATE_KEY") || "";

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "NETOPIA_SIGNATURE secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!publicKeyPem) {
      return new Response(
        JSON.stringify({ error: "NETOPIA_PUBLIC_KEY secret not configured" }),
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
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shippingAddr = (order.shipping_address as Record<string, any>) || {};
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const confirmUrl = `${siteUrl}/order-confirmation/${orderId}`;
    const ipnUrl = `${supabaseUrl}/functions/v1/netopia-ipn`;

    // Build Netopia V2 Start Payment payload
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
        posSignature: signature,
        dateTime: new Date().toISOString(),
        description: `Comandă VENTUZA #${orderId.slice(0, 8)}`,
        orderID: orderId,
        amount: order.total,
        currency: "RON",
        billing: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "",
          firstName: (shippingAddr.full_name || "").split(" ")[0] || "Client",
          lastName: (shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
          city: shippingAddr.city || "",
          country: 642,
          countryName: "Romania",
          state: shippingAddr.county || "",
          postalCode: shippingAddr.postal_code || "",
          details: shippingAddr.address || "",
        },
        shipping: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "",
          firstName: (shippingAddr.full_name || "").split(" ")[0] || "Client",
          lastName: (shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
          city: shippingAddr.city || "",
          country: 642,
          countryName: "Romania",
          state: shippingAddr.county || "",
          postalCode: shippingAddr.postal_code || "",
          details: shippingAddr.address || "",
        },
        products: [],
      },
    };

    // Call Netopia V2 API
    const netopiaRes = await fetch(`${NETOPIA_BASE}/payment/card/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: signature ? `${signature}` : "",
      },
      body: JSON.stringify(netopiaPayload),
    });

    const netopiaData = await netopiaRes.json();

    if (netopiaData.error && netopiaData.error.code !== "0" && netopiaData.error.code !== 0) {
      await supabase.from("orders").update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);

      return new Response(
        JSON.stringify({ error: netopiaData.error?.message || "Payment initiation failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store transaction
    await supabase.from("netopia_transactions").upsert({
      order_id: orderId,
      netopia_purchase_id: netopiaData.payment?.ntpID || null,
      action: "started",
      status: "pending",
      original_amount: order.total,
      updated_at: new Date().toISOString(),
    }, { onConflict: "order_id" });

    // Update order
    await supabase.from("orders").update({
      payment_status: "pending",
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    const redirectUrl = netopiaData.payment?.paymentURL || netopiaData.redirectUrl || confirmUrl;

    return new Response(
      JSON.stringify({ redirectUrl, ntpID: netopiaData.payment?.ntpID }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Netopia payment error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
