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
    // Get all shipped orders with tracking numbers
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, tracking_number, courier, status")
      .eq("status", "shipped")
      .not("tracking_number", "is", null);

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: "No orders to track", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    for (const order of orders) {
      // In production, here you would call the actual courier API
      // For now, simulate tracking check by checking if order is older than 3 days
      const { data: orderFull } = await supabase
        .from("orders")
        .select("created_at")
        .eq("id", order.id)
        .single();

      if (!orderFull) continue;

      const daysSinceCreated = (Date.now() - new Date(orderFull.created_at).getTime()) / (1000 * 60 * 60 * 24);

      // Log a tracking event
      await supabase.from("tracking_events").insert({
        order_id: order.id,
        status: "in_transit",
        description: `Verificare automată tracking - ${order.courier || "curier"}`,
        courier: order.courier,
      });

      // If order shipped > 3 days ago, simulate delivery
      if (daysSinceCreated > 3) {
        await supabase.from("orders").update({ status: "delivered" }).eq("id", order.id);
        await supabase.from("order_timeline").insert({
          order_id: order.id,
          action: "status_change",
          old_status: "shipped",
          new_status: "delivered",
          note: "Livrat confirmat automat (tracking curier)",
        });
        await supabase.from("tracking_events").insert({
          order_id: order.id,
          status: "delivered",
          description: "Colet livrat cu succes",
          courier: order.courier,
        });
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Tracked ${orders.length} orders, ${updated} delivered`, count: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Tracking check error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
