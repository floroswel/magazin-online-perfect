import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Map Netopia V2 payment status code to internal statuses.
 * V2 status codes: 3 = paid/confirmed, 5 = confirmed, 12 = error/declined,
 * 1 = new, 2 = pending_confirmation
 */
function mapV2Status(status: number): { orderStatus: string; paymentStatus: string } {
  switch (status) {
    case 3: // paid
    case 5: // confirmed
      return { orderStatus: "confirmed", paymentStatus: "paid" };
    case 12: // error / declined
      return { orderStatus: "payment_failed", paymentStatus: "failed" };
    case 1: // new / initiated
    case 2: // pending confirmation
      return { orderStatus: "pending_payment", paymentStatus: "pending" };
    case 10: // scheduled
      return { orderStatus: "pending_payment", paymentStatus: "pending" };
    case 8: // refunded / credit
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
    // V2 IPN sends JSON
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("json")) {
      body = await req.json();
    } else {
      // Fallback: try to parse as JSON anyway
      const text = await req.text();
      console.log("IPN raw body (non-JSON content-type):", text.slice(0, 2000));
      try {
        body = JSON.parse(text);
      } catch {
        console.error("IPN: cannot parse body as JSON");
        return new Response(
          JSON.stringify({ errorCode: 1, errorMessage: "Invalid JSON body" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Netopia V2 IPN received:", JSON.stringify(body).slice(0, 2000));

    const payment = body.payment || {};
    const order = body.order || {};
    const ntpID = payment.ntpID || "";
    const status = payment.status ?? -1;
    const orderId = order.orderID || "";
    const errorCode = body.error?.code || payment.error?.code || "0";
    const errorMessage = body.error?.message || payment.error?.message || "";

    console.log("IPN parsed — orderId:", orderId, "ntpID:", ntpID, "status:", status, "errorCode:", errorCode);

    if (!orderId) {
      console.error("IPN missing orderID");
      return new Response(
        JSON.stringify({ errorCode: 1, errorMessage: "Missing orderID" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderStatus, paymentStatus } = mapV2Status(status);
    const now = new Date().toISOString();

    // Idempotency check
    const { data: existingTx } = await supabase
      .from("netopia_transactions")
      .select("id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingTx && existingTx.status === paymentStatus) {
      console.log("IPN already processed for order:", orderId);
      return new Response(
        JSON.stringify({ errorCode: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert transaction
    const txPayload = {
      order_id: orderId,
      netopia_order_id: ntpID || orderId,
      action: String(status),
      error_code: String(errorCode),
      error_message: errorMessage || null,
      status: paymentStatus,
      ipn_raw_xml: JSON.stringify(body),
      ipn_received_at: now,
      updated_at: now,
    };

    if (existingTx) {
      await supabase.from("netopia_transactions").update(txPayload).eq("id", existingTx.id);
    } else {
      await supabase.from("netopia_transactions").insert(txPayload);
    }

    // Update order
    await supabase.from("orders").update({
      status: orderStatus,
      payment_status: paymentStatus,
      updated_at: now,
    }).eq("id", orderId);

    console.log("IPN processed — order:", orderId, "status:", orderStatus, "payment:", paymentStatus);

    // Send confirmation email on successful payment
    if (orderStatus === "confirmed") {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*, order_items(*, products(name, price, image_url))")
          .eq("id", orderId)
          .single();

        if (orderData?.user_email) {
          const shippingAddr = (orderData.shipping_address as any) || {};
          await supabase.functions.invoke("send-email", {
            body: {
              type: "order_placed",
              to: orderData.user_email,
              data: {
                orderId: orderData.id,
                customerName: shippingAddr.fullName || shippingAddr.full_name || "Client",
                total: orderData.total,
                paymentMethod: "card_online",
                items: (orderData.order_items || []).map((i: any) => ({
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
              to: "admin@mamalucica.ro",
              data: {
                orderId: orderData.id,
                customerName: shippingAddr.fullName || shippingAddr.full_name || "Client",
                total: orderData.total,
                paymentMethod: "card_online",
                email: orderData.user_email,
                items: (orderData.order_items || []).map((i: any) => ({
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

    // V2 expects JSON response with errorCode: 0
    return new Response(
      JSON.stringify({ errorCode: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("NETOPIA V2 IPN error:", err);
    return new Response(
      JSON.stringify({ errorCode: 99, errorMessage: err instanceof Error ? err.message : "Internal error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
