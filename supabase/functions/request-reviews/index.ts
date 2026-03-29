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

    // Load review settings
    const { data: settingsRow } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "review_settings")
      .maybeSingle();

    const settings = settingsRow?.value_json || {};
    const requestDays = (settings as any).request_days_after_delivery || 5;
    const reminderDays = (settings as any).reminder_days || 7;

    const now = new Date();

    // Find orders delivered X days ago that haven't had review request sent
    const requestCutoff = new Date(now.getTime() - requestDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: eligibleOrders } = await supabase
      .from("orders")
      .select("id, user_id, user_email")
      .eq("status", "delivered")
      .eq("review_request_sent", false)
      .lte("updated_at", requestCutoff)
      .limit(50);

    let sentCount = 0;

    for (const order of eligibleOrders || []) {
      // Check if user already has reviews for products in this order
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name")
        .eq("order_id", order.id)
        .limit(5);

      if (!items || items.length === 0) continue;

      const productIds = items.map((i: any) => i.product_id);
      const { data: existingReviews } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", order.user_id)
        .in("product_id", productIds);

      const reviewedIds = new Set((existingReviews || []).map((r: any) => r.product_id));
      const unreviewedProducts = items.filter((i: any) => !reviewedIds.has(i.product_id));

      if (unreviewedProducts.length === 0) {
        // All products already reviewed, mark as sent
        await supabase.from("orders").update({ review_request_sent: true }).eq("id", order.id);
        continue;
      }

      // Get customer name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const customerName = profile?.full_name || "Client";
      const email = order.user_email;

      if (!email) continue;

      // Send review request email via send-email function
      const subject = ((settings as any).email_subject || "Cum a fost experiența ta?")
        .replace("{{order_id}}", order.id.slice(0, 8))
        .replace("{{customer_name}}", customerName);

      const productList = unreviewedProducts
        .map((p: any) => `<li>${p.product_name}</li>`)
        .join("");

      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bună, ${customerName}!</h2>
          <p>${((settings as any).email_body || "Sperăm că ești mulțumit/ă de produsele comandate.")
            .replace("{{customer_name}}", customerName)
            .replace("{{order_id}}", order.id.slice(0, 8))}</p>
          <p>Produse de evaluat:</p>
          <ul>${productList}</ul>
          <p>Spune-ne cum a fost experiența ta:</p>
          <div style="text-align: center; margin: 20px 0;">
            ${[1, 2, 3, 4, 5].map(s => `<span style="font-size: 32px; cursor: pointer; color: ${s <= 3 ? '#fbbf24' : '#fbbf24'};">★</span>`).join(" ")}
          </div>
          <p style="text-align: center;">
            <a href="${Deno.env.get("SITE_URL") || Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '#'}" 
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
              Scrie o recenzie
            </a>
          </p>
        </div>
      `;

      try {
        await supabase.functions.invoke("send-email", {
          body: { to: email, subject, html: body },
        });
        sentCount++;
      } catch (e) {
        console.error("Failed to send review request email:", e);
      }

      await supabase.from("orders").update({
        review_request_sent: true,
        review_request_sent_at: now.toISOString(),
      }).eq("id", order.id);
    }

    // Handle reminders
    const reminderCutoff = new Date(now.getTime() - reminderDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: reminderOrders } = await supabase
      .from("orders")
      .select("id, user_id, user_email")
      .eq("status", "delivered")
      .eq("review_request_sent", true)
      .eq("review_reminder_sent", false)
      .lte("review_request_sent_at", reminderCutoff)
      .limit(50);

    let reminderCount = 0;

    for (const order of reminderOrders || []) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", order.id)
        .limit(5);

      if (!items || items.length === 0) continue;

      const { data: existingReviews } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", order.user_id)
        .in("product_id", items.map((i: any) => i.product_id));

      if ((existingReviews || []).length > 0) {
        // Already submitted review, skip reminder
        await supabase.from("orders").update({ review_reminder_sent: true }).eq("id", order.id);
        continue;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const customerName = profile?.full_name || "Client";
      const email = order.user_email;
      if (!email) continue;

      const subject = ((settings as any).reminder_subject || "Ai uitat să ne spui părerea ta")
        .replace("{{customer_name}}", customerName);

      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bună, ${customerName}!</h2>
          <p>${((settings as any).reminder_body || "Îți reamintim că poți lăsa o recenzie.")
            .replace("{{customer_name}}", customerName)}</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '#'}" 
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
              Scrie o recenzie
            </a>
          </p>
        </div>
      `;

      try {
        await supabase.functions.invoke("send-email", {
          body: { to: email, subject, html: body },
        });
        reminderCount++;
      } catch (e) {
        console.error("Failed to send reminder:", e);
      }

      await supabase.from("orders").update({ review_reminder_sent: true }).eq("id", order.id);
    }

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      reminders: reminderCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
