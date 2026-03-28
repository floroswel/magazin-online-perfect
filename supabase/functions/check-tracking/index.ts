import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SAMEDAY_API = "https://api.sameday.ro";

async function getSamedayToken(username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch("https://sameday.ro/api/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch { return null; }
}

async function getSamedayTracking(token: string, awb: string): Promise<any[]> {
  try {
    const res = await fetch(`${SAMEDAY_API}/api/client/tracking/${awb}`, {
      headers: { "X-AUTH-TOKEN": token },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.deliveryAttempts || data.history || [];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const singleAwb = body.awb;
    const singleOrderId = body.order_id;

    // Get Sameday credentials
    let samedayToken: string | null = null;
    const { data: samedayConfig } = await supabase.from("courier_configs").select("settings").eq("courier", "sameday").eq("is_active", true).maybeSingle();
    const creds = samedayConfig?.settings as any;
    if (creds?.username && creds?.password) {
      samedayToken = await getSamedayToken(creds.username, creds.password);
    }

    // Single AWB tracking
    if (singleAwb || singleOrderId) {
      let awb = singleAwb;
      let orderId = singleOrderId;
      
      if (orderId && !awb) {
        const { data: order } = await supabase.from("orders").select("tracking_number").eq("id", orderId).single();
        awb = order?.tracking_number;
      }

      if (!awb) {
        return new Response(JSON.stringify({ error: "No AWB found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let events: any[] = [];
      if (samedayToken) {
        const tracking = await getSamedayTracking(samedayToken, awb);
        events = tracking.map((e: any) => ({
          status: e.statusId === 35 ? "delivered" : e.statusId === 4 ? "in_transit" : "processing",
          description: e.statusName || e.status || "Update",
          timestamp: e.createdAt || e.date,
          location: e.transitLocation || e.county || "",
        }));
      }

      // Also get DB events
      const { data: dbEvents } = await supabase.from("tracking_events").select("*").eq("order_id", orderId || "").order("created_at", { ascending: true });

      return new Response(JSON.stringify({ awb, events, db_events: dbEvents || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bulk tracking check for all shipped orders
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
      if (order.courier === "sameday" && samedayToken && order.tracking_number) {
        const tracking = await getSamedayTracking(samedayToken, order.tracking_number);
        const isDelivered = tracking.some((e: any) => e.statusId === 35);

        for (const event of tracking) {
          await supabase.from("tracking_events").insert({
            order_id: order.id,
            status: event.statusId === 35 ? "delivered" : "in_transit",
            description: event.statusName || "Update tracking",
            courier: "sameday",
          });
        }

        if (isDelivered) {
          await supabase.from("orders").update({ status: "delivered" }).eq("id", order.id);
          await supabase.from("order_timeline").insert({
            order_id: order.id, action: "status_change", old_status: "shipped", new_status: "delivered",
            note: "Livrat confirmat automat (tracking Sameday)",
          });
          updated++;
        }
      } else {
        // Fallback: check age
        const { data: orderFull } = await supabase.from("orders").select("created_at").eq("id", order.id).single();
        if (!orderFull) continue;
        const daysSince = (Date.now() - new Date(orderFull.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 3) {
          await supabase.from("orders").update({ status: "delivered" }).eq("id", order.id);
          await supabase.from("order_timeline").insert({
            order_id: order.id, action: "status_change", old_status: "shipped", new_status: "delivered",
            note: "Livrat confirmat automat (tracking curier)",
          });
          updated++;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Tracked ${orders.length} orders, ${updated} delivered`, count: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
