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

    const mokkaApiKey = Deno.env.get("MOKKA_API_KEY");
    if (!mokkaApiKey) {
      return new Response(JSON.stringify({ error: "Mokka not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const shippingAddr = order.shipping_address as Record<string, any> || {};
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const confirmUrl = `${siteUrl}/order-confirmation/${orderId}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/mokka-checkout`;

    // Mokka API — create checkout session
    const mokkaPayload = {
      amount: Math.round(order.total * 100), // cents
      currency: "RON",
      description: `Comandă Mama Lucica #${orderId.slice(0, 8)}`,
      external_id: orderId,
      customer: {
        email: order.user_email || shippingAddr.email || "",
        first_name: (shippingAddr.full_name || "").split(" ")[0] || "",
        last_name: (shippingAddr.full_name || "").split(" ").slice(1).join(" ") || "",
        phone: shippingAddr.phone || "",
      },
      redirect_url: confirmUrl,
      webhook_url: webhookUrl,
    };

    const mokkaRes = await fetch("https://api.mokka.ro/api/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mokkaApiKey}`,
      },
      body: JSON.stringify(mokkaPayload),
    });

    const mokkaData = await mokkaRes.json();

    if (!mokkaRes.ok) {
      console.error("Mokka API error:", mokkaData);
      return new Response(JSON.stringify({ error: mokkaData.message || "Mokka payment failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update order
    await supabase.from("orders").update({
      payment_status: "pending",
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({ redirectUrl: mokkaData.checkout_url || mokkaData.redirect_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Mokka payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
