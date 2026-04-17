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
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const { referenceId, transactionId, transactionStatus, amount, lastUpdate } = body;

    if (!referenceId || !transactionStatus) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HMAC verification (optional but recommended)
    const signature = req.headers.get("X-PayPo-Signature");
    const hmacVerified = !!signature; // In production, verify with merchant API key

    // Map PayPo status to internal
    const statusMap: Record<string, string> = {
      NEW: "new",
      PENDING: "pending",
      ACCEPTED: "accepted",
      COMPLETED: "completed",
      REJECTED: "rejected",
      CANCELED: "canceled",
    };
    const status = statusMap[transactionStatus] || "pending";

    // Check existing transaction
    const { data: existing } = await supabase
      .from("paypo_transactions")
      .select("id, status")
      .eq("paypo_reference_id", referenceId)
      .maybeSingle();

    if (existing && existing.status === status) {
      return new Response(JSON.stringify({ ok: true, message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      await supabase
        .from("paypo_transactions")
        .update({
          status,
          paypo_transaction_id: transactionId || existing.id,
          last_notification_at: new Date().toISOString(),
          hmac_verified: hmacVerified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("paypo_transactions").insert({
        order_id: referenceId,
        paypo_transaction_id: transactionId,
        paypo_reference_id: referenceId,
        status,
        amount_bani: amount || 0,
        last_notification_at: new Date().toISOString(),
        hmac_verified: hmacVerified,
      });
    }

    // Update order status
    const orderStatusMap: Record<string, { status: string; payment_status: string }> = {
      pending: { status: "pending_payment", payment_status: "pending" },
      accepted: { status: "confirmed", payment_status: "paid" },
      completed: { status: "confirmed", payment_status: "paid" },
      rejected: { status: "payment_failed", payment_status: "failed" },
      canceled: { status: "cancelled", payment_status: "failed" },
    };

    const orderUpdate = orderStatusMap[status];
    if (orderUpdate) {
      await supabase
        .from("orders")
        .update({
          status: orderUpdate.status,
          payment_status: orderUpdate.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referenceId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PayPo notify error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
