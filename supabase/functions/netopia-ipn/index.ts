import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function mapStatusToOrderStatus(status: number): { orderStatus: string; paymentStatus: string } {
  // Netopia V2 payment statuses:
  // 3 = paid/confirmed, 5 = confirmed/settled, 12 = declined, 15 = 3DS pending
  switch (status) {
    case 3: return { orderStatus: "confirmed", paymentStatus: "confirmed" };
    case 5: return { orderStatus: "confirmed", paymentStatus: "settled" };
    case 12: return { orderStatus: "payment_failed", paymentStatus: "failed" };
    case 15: return { orderStatus: "pending_payment", paymentStatus: "pending_3ds" };
    default: return { orderStatus: "pending_payment", paymentStatus: "pending" };
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
    // Netopia V2 sends JSON callbacks to notifyUrl
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("form")) {
      // Legacy V1 form-urlencoded
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    console.log("Netopia IPN received:", JSON.stringify(body).slice(0, 2000));

    // V2 callback structure: { order: { orderID, ... }, payment: { status, ntpID, ... }, ... }
    const orderId = body?.order?.orderID || body?.orderID || "";
    const paymentStatus = body?.payment?.status ?? -1;
    const ntpID = body?.payment?.ntpID || "";
    const errorCode = body?.error?.code ?? "0";
    const errorMessage = body?.error?.message || "";

    if (!orderId) {
      console.error("IPN missing orderID:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ errorCode: 1, errorMessage: "Missing orderID" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderStatus, paymentStatus: mappedPaymentStatus } = mapStatusToOrderStatus(paymentStatus);
    const now = new Date().toISOString();

    // Check for idempotency
    const { data: existingTx } = await supabase
      .from("netopia_transactions")
      .select("id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingTx && existingTx.status === mappedPaymentStatus) {
      console.log("IPN already processed for order:", orderId, "status:", mappedPaymentStatus);
      return new Response(
        JSON.stringify({ errorCode: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update or insert transaction
    const txPayload = {
      order_id: orderId,
      netopia_purchase_id: ntpID || null,
      action: String(paymentStatus),
      error_code: String(errorCode),
      error_message: errorMessage || null,
      status: mappedPaymentStatus,
      ipn_raw_xml: JSON.stringify(body),
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
    await supabase
      .from("orders")
      .update({
        status: orderStatus,
        payment_status: mappedPaymentStatus,
        updated_at: now,
      })
      .eq("id", orderId);

    console.log("IPN processed — order:", orderId, "status:", orderStatus, "payment:", mappedPaymentStatus);

    // If payment confirmed, send confirmation email
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

    // Respond to Netopia with success
    return new Response(
      JSON.stringify({ errorCode: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("NETOPIA IPN error:", err);
    return new Response(
      JSON.stringify({ errorCode: 1, errorMessage: "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
