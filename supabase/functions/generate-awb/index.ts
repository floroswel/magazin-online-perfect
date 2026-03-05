import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COURIER_TRACKING_URLS: Record<string, string> = {
  fan_courier: "https://www.fancourier.ro/awb-tracking/?metession=",
  sameday: "https://www.sameday.ro/tracking?awb=",
  cargus: "https://app.urgentcargus.ro/Private/Tracking.aspx?CodBara=",
  dpd: "https://tracking.dpd.ro/?shipmentNumber=",
  gls: "https://gls-group.com/RO/ro/urmarire-colete?match=",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { order_ids, courier } = await req.json();

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return new Response(JSON.stringify({ error: "order_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get courier config
    let courierConfig = null;
    if (courier) {
      const { data } = await supabase
        .from("courier_configs")
        .select("*")
        .eq("courier", courier)
        .eq("is_active", true)
        .single();
      courierConfig = data;
    }

    const results: { order_id: string; awb: string; success: boolean; error?: string }[] = [];

    for (const orderId of order_ids) {
      try {
        // Get order details
        const { data: order } = await supabase
          .from("orders")
          .select("*, order_items(*, products(name, weight))")
          .eq("id", orderId)
          .single();

        if (!order) {
          results.push({ order_id: orderId, awb: "", success: false, error: "Comanda nu a fost găsită" });
          continue;
        }

        if (order.tracking_number) {
          results.push({ order_id: orderId, awb: order.tracking_number, success: true });
          continue;
        }

        // In production, call the actual courier API here
        // For now, generate a simulated AWB
        const courierKey = courier || "fan_courier";
        const prefix = courierKey === "fan_courier" ? "FC" : courierKey === "sameday" ? "SD" : courierKey === "cargus" ? "CG" : courierKey === "dpd" ? "DP" : "GL";
        const awb = `${prefix}${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
        const trackingUrl = (COURIER_TRACKING_URLS[courierKey] || "") + awb;

        // Update order
        await supabase.from("orders").update({
          tracking_number: awb,
          courier: courierKey,
          tracking_url: trackingUrl,
          status: "shipped",
          shipping_status: "shipped",
          awb_generated_at: new Date().toISOString(),
        }).eq("id", orderId);

        // Log timeline
        await supabase.from("order_timeline").insert({
          order_id: orderId,
          action: "status_change",
          old_status: order.status,
          new_status: "shipped",
          note: `AWB generat: ${awb} (${courierConfig?.display_name || courierKey})`,
        });

        // Log tracking event
        await supabase.from("tracking_events").insert({
          order_id: orderId,
          status: "picked_up",
          description: `AWB ${awb} generat, colet preluat de ${courierConfig?.display_name || courierKey}`,
          courier: courierKey,
        });

        // Send tracking email to customer
        if (order.user_email) {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "tracking",
              to: order.user_email,
              data: {
                orderId: order.order_number || orderId.slice(0, 8),
                awb,
                trackingUrl,
                courier: courierConfig?.display_name || courierKey,
              },
            },
          });
        }

        results.push({ order_id: orderId, awb, success: true });
      } catch (err) {
        results.push({ order_id: orderId, awb: "", success: false, error: String(err) });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ results, summary: { total: order_ids.length, succeeded, failed } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AWB generation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
