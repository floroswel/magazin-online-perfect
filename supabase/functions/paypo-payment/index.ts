import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders").select("*").eq("id", orderId).single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paypoApiKey = Deno.env.get("PAYPO_API_KEY");
    if (!paypoApiKey) {
      return new Response(JSON.stringify({ error: "PayPo not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const shippingAddr = order.shipping_address as Record<string, any> || {};
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const confirmUrl = `${siteUrl}/order-confirmation/${orderId}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/paypo-notify`;

    const paypoPayload = {
      amount: order.total,
      currency: "RON",
      description: `Comandă VENTUZA #${orderId.slice(0, 8)}`,
      externalOrderId: orderId,
      buyer: {
        email: order.user_email || shippingAddr.email || "",
        firstName: (shippingAddr.full_name || "").split(" ")[0] || "",
        lastName: (shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
        phone: shippingAddr.phone || "",
      },
      redirectUrl: confirmUrl,
      notifyUrl: webhookUrl,
    };

    const paypoRes = await fetch("https://api.paypo.pl/v2/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paypoApiKey}`,
      },
      body: JSON.stringify(paypoPayload),
    });

    const paypoData = await paypoRes.json();

    if (!paypoRes.ok) {
      console.error("PayPo API error:", paypoData);
      return new Response(JSON.stringify({ error: paypoData.message || "PayPo payment failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("orders").update({
      payment_status: "pending",
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({ redirectUrl: paypoData.redirectUrl || paypoData.checkout_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("PayPo payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
