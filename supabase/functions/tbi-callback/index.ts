import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { order_id, status_id, motiv } = body;

    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map TBI status_id to internal status
    let status = "pending";
    if (String(status_id) === "1" && !motiv) status = "approved";
    else if (String(status_id) === "2") status = "pending";
    else if (String(status_id) === "0" && motiv) status = "rejected";
    else if (String(status_id) === "0") status = "cancelled";

    // Check for existing transaction
    const { data: existing } = await supabase
      .from("tbi_transactions")
      .select("id, status")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing && existing.status === status) {
      // Idempotent: duplicate callback, same status
      return new Response(JSON.stringify({ ok: true, message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      // Update existing transaction
      await supabase
        .from("tbi_transactions")
        .update({
          status,
          status_id_raw: String(status_id),
          motiv: motiv || null,
          last_callback_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new transaction record
      await supabase
        .from("tbi_transactions")
        .insert({
          order_id,
          status,
          status_id_raw: String(status_id),
          motiv: motiv || null,
          last_callback_at: new Date().toISOString(),
        });
    }

    // Update order status based on TBI response
    const orderStatusMap: Record<string, string> = {
      approved: "confirmed",
      pending: "pending_payment",
      rejected: "payment_failed",
      cancelled: "cancelled",
    };

    const orderStatus = orderStatusMap[status];
    if (orderStatus) {
      await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_status: status === "approved" ? "paid" : status === "pending" ? "pending" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);
    }

    return new Response(JSON.stringify({ ok: true, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TBI callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
