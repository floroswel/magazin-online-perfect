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
    const apiKey = Deno.env.get("NETOPIA_API_KEY") || "";
    console.log("DIAG api_key_length:", apiKey.length);
    console.log("DIAG api_key_first15:", apiKey.substring(0, 15));
    const testBody = {
      config: { emailTemplate: "", notifyUrl: "https://example.com/ipn", redirectUrl: "https://example.com/return", language: "ro" },
      payment: { options: { installments: 0, bonus: 0 }, instrument: { type: "card" }, data: {} },
      order: { ntpID: "", posSignature: "3BBD-XEHU-UYUY-4VLV-UQPW", dateTime: new Date().toISOString(), description: "Test diagnostic", orderID: "diag-001", amount: 1, currency: "RON", billing: { email: "test@test.com", phone: "0700000000", firstName: "Test", lastName: "User", city: "Bucuresti", country: 642, state: "B", postalCode: "010101", details: "test" }, shipping: { email: "test@test.com", phone: "0700000000", firstName: "Test", lastName: "User", city: "Bucuresti", country: 642, state: "B", postalCode: "010101", details: "test" }, products: [], installments: { selected: 0, available: [0] }, data: {} }
    };
    const resp = await fetch("https://secure.sandbox.netopia-payments.com/payment/card/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify(testBody),
    });
    const body = await resp.text();
    console.log("DIAG netopia_status:", resp.status);
    console.log("DIAG netopia_body:", body);
    return new Response(JSON.stringify({ api_key_length: apiKey.length, api_key_first15: apiKey.substring(0, 15), netopia_status: resp.status, netopia_body: body }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      .select("config_json")
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

    const config = pm.config_json as Record<string, any>;
    const apiKey = config.api_key || Deno.env.get("NETOPIA_API_KEY") || "";
    const posSignature = config.pos_signature || config.merchant_id || "";
    const isSandbox = config.sandbox === "true" || config.sandbox === true;

    const gatewayUrl = isSandbox
      ? "https://secure.sandbox.netopia-payments.com/payment/card/start"
      : "https://secure.mobilpay.ro/pay/payment/card/start";

    console.log("V2 Config — posSignature:", posSignature, "sandbox:", isSandbox, "url:", gatewayUrl, "apiKey present:", !!apiKey);

    if (!posSignature || !apiKey) {
      console.error("Netopia V2 config incomplete. Keys:", Object.keys(config));
      return new Response(
        JSON.stringify({ error: "Configurare Netopia incompletă (lipsește api_key sau pos_signature)" }),
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
    const notifyUrl = `${supabaseUrl}/functions/v1/netopia-ipn`;

    const fullName = shippingAddr.fullName || shippingAddr.full_name || "Client";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Client";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    // 3. Build V2 JSON request
    const requestBody = {
      config: {
        emailTemplate: "",
        notifyUrl,
        redirectUrl: returnUrl,
        language: "ro",
      },
      payment: {
        options: {
          installments: 0,
          bonus: 0,
        },
        instrument: {
          type: "card",
        },
        data: {
          BROWSER_USER_AGENT: "",
          OS: "",
          OS_VERSION: "",
          MOBILE: "false",
          SCREEN_POINT: "",
          SCREEN_PRINT: "",
          BROWSER_COLOR_DEPTH: "24",
          BROWSER_SCREEN_HEIGHT: "900",
          BROWSER_SCREEN_WIDTH: "1440",
          BROWSER_PLUGINS: "",
          BROWSER_JAVA_ENABLED: "false",
          BROWSER_LANGUAGE: "ro",
          BROWSER_TZ: "Europe/Bucharest",
          BROWSER_TZ_OFFSET: "-120",
          IP_ADDRESS: "",
        },
      },
      order: {
        ntpID: "",
        posSignature,
        dateTime: new Date().toISOString(),
        description: `Comanda VENTUZA #${orderId.slice(0, 8)}`,
        orderID: orderId,
        amount: Number(order.total),
        currency: "RON",
        billing: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "0700000000",
          firstName,
          lastName,
          city: shippingAddr.city || "Bucuresti",
          country: 642,
          state: shippingAddr.county || "Ilfov",
          postalCode: shippingAddr.postalCode || shippingAddr.postal_code || "077190",
          details: shippingAddr.address || "",
        },
        shipping: {
          email: order.user_email || shippingAddr.email || "",
          phone: shippingAddr.phone || "0700000000",
          firstName,
          lastName,
          city: shippingAddr.city || "Bucuresti",
          country: 642,
          state: shippingAddr.county || "Ilfov",
          postalCode: shippingAddr.postalCode || shippingAddr.postal_code || "077190",
          details: shippingAddr.address || "",
        },
        products: [],
        installments: {
          selected: 0,
          available: [0],
        },
        data: {},
      },
    };

    console.log("Netopia V2 request — amount:", order.total, "orderID:", orderId);

    // 4. Call Netopia V2 API
    const netopiaResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await netopiaResponse.text();
    console.log("Netopia V2 response status:", netopiaResponse.status);
    console.log("Netopia V2 response:", responseText.slice(0, 2000));

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Non-JSON response from Netopia:", responseText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Răspuns invalid de la Netopia" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Extract payment URL
    if (responseData.payment?.paymentURL) {
      // Store transaction
      await supabase.from("netopia_transactions").upsert({
        order_id: orderId,
        netopia_order_id: responseData.payment?.ntpID || orderId,
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

      console.log("V2 success — paymentURL:", responseData.payment.paymentURL);

      return new Response(
        JSON.stringify({
          paymentUrl: responseData.payment.paymentURL,
          ntpID: responseData.payment.ntpID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Error from Netopia
    console.error("No paymentURL in Netopia response:", JSON.stringify(responseData));
    return new Response(
      JSON.stringify({ error: responseData.error?.message || responseData.message || "Eroare Netopia V2" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Netopia V2 payment error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare internă server" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
