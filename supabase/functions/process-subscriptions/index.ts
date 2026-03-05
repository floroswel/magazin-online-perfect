import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find active subscriptions due for renewal
    const now = new Date().toISOString();
    const { data: dueSubs, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*, products(name, price), addresses:delivery_address_id(*)")
      .eq("status", "active")
      .lte("next_renewal_date", now);

    if (fetchError) throw fetchError;
    if (!dueSubs || dueSubs.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions due", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FREQ_DAYS: Record<string, number> = {
      weekly: 7, biweekly: 14, monthly: 30, bimonthly: 60, quarterly: 90,
    };

    let processed = 0;
    let failed = 0;

    for (const sub of dueSubs) {
      try {
        const price = sub.products?.price || 0;
        const discountedPrice = price * (1 - (sub.discount_percent || 0) / 100);
        const total = discountedPrice * sub.quantity;
        const addr = sub.addresses;

        const shippingAddress = addr ? {
          fullName: addr.full_name,
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
          county: addr.county,
          postalCode: addr.postal_code || "",
        } : { fullName: "—", phone: "", address: "", city: "", county: "", postalCode: "" };

        // Create order
        const { data: order, error: orderErr } = await supabase.from("orders").insert({
          user_id: sub.customer_id,
          total,
          payment_method: sub.payment_method_saved || "ramburs",
          shipping_address: shippingAddress,
          status: "pending",
          currency: "RON",
        }).select().single();

        if (orderErr || !order) {
          console.error("Order creation failed for sub", sub.id, orderErr);
          failed++;
          continue;
        }

        // Create order item
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: sub.product_id,
          quantity: sub.quantity,
          price: discountedPrice,
        });

        // Link subscription to order
        await supabase.from("subscription_orders").insert({
          subscription_id: sub.id,
          order_id: order.id,
          renewal_number: (sub.total_renewals || 0) + 1,
        });

        // Calculate next renewal
        const days = FREQ_DAYS[sub.frequency] || 30;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);

        await supabase.from("subscriptions").update({
          next_renewal_date: nextDate.toISOString(),
          total_renewals: (sub.total_renewals || 0) + 1,
          total_revenue: (sub.total_revenue || 0) + total,
          updated_at: new Date().toISOString(),
        }).eq("id", sub.id);

        // Send notification email
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "subscription_renewal",
              to: null, // will be looked up by user_id
              data: {
                orderId: order.id,
                customerName: shippingAddress.fullName,
                total,
                productName: sub.products?.name,
                nextRenewal: nextDate.toLocaleDateString("ro-RO"),
              },
            },
          });
        } catch (emailErr) {
          console.error("Email failed for sub", sub.id, emailErr);
        }

        processed++;
      } catch (subErr) {
        console.error("Subscription processing failed", sub.id, subErr);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed, total: dueSubs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Process subscriptions error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
