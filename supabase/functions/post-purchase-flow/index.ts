import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    let email1Count = 0, email2Count = 0, email3Count = 0;

    // ── EMAIL 1: Confirmare + Ghid Îngrijire (imediat după confirmare) ──
    // Comenzi confirmate în ultimele 2 ore, fără email_care_guide_sent
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: newOrders } = await supabase
      .from("orders")
      .select("id, user_id, user_email, order_number")
      .eq("status", "confirmed")
      .is("care_guide_sent_at", null)
      .gte("updated_at", twoHoursAgo)
      .limit(50);

    for (const order of newOrders || []) {
      if (!order.user_email) continue;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const name = profile?.full_name || "Client";

      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "care_guide",
            to: order.user_email,
            data: { name, orderId: order.id, orderNumber: order.order_number },
          },
        });
        email1Count++;
      } catch (e) { console.error("Care guide email failed:", e); }

      await supabase.from("orders").update({ care_guide_sent_at: now.toISOString() }).eq("id", order.id);
    }

    // ── EMAIL 2: Tracking Update (ziua 3 după confirmare) ──
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trackingOrders } = await supabase
      .from("orders")
      .select("id, user_id, user_email, order_number, tracking_number, status")
      .in("status", ["confirmed", "processing", "shipped"])
      .is("tracking_email_sent_at", null)
      .lte("updated_at", threeDaysAgo)
      .gte("updated_at", fourDaysAgo)
      .limit(50);

    for (const order of trackingOrders || []) {
      if (!order.user_email) continue;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const name = profile?.full_name || "Client";
      const siteUrl = Deno.env.get("SITE_URL") || "https://mamalucica.ro";

      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "tracking_update",
            to: order.user_email,
            data: {
              name,
              orderId: order.id,
              orderNumber: order.order_number,
              trackingNumber: order.tracking_number,
              status: order.status,
              trackingUrl: `${siteUrl}/tracking`,
            },
          },
        });
        email2Count++;
      } catch (e) { console.error("Tracking email failed:", e); }

      await supabase.from("orders").update({ tracking_email_sent_at: now.toISOString() }).eq("id", order.id);
    }

    // ── EMAIL 3: Cerere Recenzie (ziua 14 după confirmare) ──
    // Delegate to existing request-reviews function logic
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const { data: reviewOrders } = await supabase
      .from("orders")
      .select("id, user_id, user_email, order_number")
      .in("status", ["delivered", "confirmed", "shipped"])
      .eq("review_request_sent", false)
      .lte("updated_at", fourteenDaysAgo)
      .gte("updated_at", fifteenDaysAgo)
      .limit(50);

    for (const order of reviewOrders || []) {
      if (!order.user_email) continue;

      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name")
        .eq("order_id", order.id)
        .limit(5);

      if (!items || items.length === 0) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const name = profile?.full_name || "Client";
      const siteUrl = Deno.env.get("SITE_URL") || "https://mamalucica.ro";

      const productNames = items.map((i: any) => i.product_name).filter(Boolean);

      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "review_request",
            to: order.user_email,
            data: {
              name,
              orderId: order.id,
              orderNumber: order.order_number,
              products: productNames,
              reviewUrl: `${siteUrl}/account`,
            },
          },
        });
        email3Count++;
      } catch (e) { console.error("Review request email failed:", e); }

      await supabase.from("orders").update({
        review_request_sent: true,
        review_request_sent_at: now.toISOString(),
      }).eq("id", order.id);
    }

    return new Response(JSON.stringify({
      success: true,
      careGuidesSent: email1Count,
      trackingEmailsSent: email2Count,
      reviewRequestsSent: email3Count,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
