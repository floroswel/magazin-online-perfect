import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get active win-back campaigns
    const { data: campaigns } = await supabaseAdmin
      .from("winback_campaigns")
      .select("*")
      .eq("is_active", true);

    if (!campaigns?.length) {
      return new Response(JSON.stringify({ message: "No active campaigns" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let enrolled = 0;
    let emailsSent = 0;
    let markedLost = 0;

    for (const campaign of campaigns) {
      // 2. Find inactive customers who haven't been enrolled yet
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - campaign.trigger_days);

      const { data: inactiveProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name")
        .lt("updated_at", cutoffDate.toISOString())
        .limit(100);

      if (inactiveProfiles?.length) {
        for (const profile of inactiveProfiles) {
          // Check not already enrolled in this campaign
          const { data: existing } = await supabaseAdmin
            .from("winback_enrollments")
            .select("id")
            .eq("campaign_id", campaign.id)
            .eq("user_id", profile.user_id)
            .maybeSingle();

          if (!existing) {
            // Check if they have recent orders (truly inactive)
            const { data: recentOrders } = await supabaseAdmin
              .from("orders")
              .select("id")
              .eq("user_id", profile.user_id)
              .gte("created_at", cutoffDate.toISOString())
              .limit(1);

            if (!recentOrders?.length) {
              await supabaseAdmin.from("winback_enrollments").insert({
                campaign_id: campaign.id,
                user_id: profile.user_id,
                user_email: null, // Will be fetched when sending
                status: "active",
              });
              enrolled++;
            }
          }
        }
      }

      // 3. Process email sequence for enrolled customers
      const { data: activeEnrollments } = await supabaseAdmin
        .from("winback_enrollments")
        .select("*")
        .eq("campaign_id", campaign.id)
        .eq("status", "active")
        .eq("converted", false)
        .limit(50);

      if (!activeEnrollments?.length) continue;

      const now = new Date();

      for (const enrollment of activeEnrollments) {
        // Check if customer purchased since enrollment
        const { data: newOrders } = await supabaseAdmin
          .from("orders")
          .select("id, total")
          .eq("user_id", enrollment.user_id)
          .gte("created_at", enrollment.created_at)
          .limit(1);

        if (newOrders?.length) {
          // Customer converted!
          await supabaseAdmin.from("winback_enrollments").update({
            converted: true,
            converted_at: now.toISOString(),
            converted_order_id: newOrders[0].id,
            revenue: newOrders[0].total,
            status: "converted",
          }).eq("id", enrollment.id);
          continue;
        }

        // Email 1: send immediately if not sent
        if (campaign.email_1_enabled && !enrollment.email_1_sent_at) {
          try {
            await supabaseAdmin.functions.invoke("send-email", {
              body: {
                to: enrollment.user_email || `user-${enrollment.user_id}@placeholder.local`,
                subject: campaign.email_1_subject,
                html: `<p>Ne este dor de tine! Descoperă ce mai e nou în magazinul nostru.</p>`,
                type: "winback_1",
              },
            });
            await supabaseAdmin.from("winback_enrollments").update({
              email_1_sent_at: now.toISOString(),
            }).eq("id", enrollment.id);
            emailsSent++;
          } catch {}
          continue;
        }

        // Email 2: after delay
        if (campaign.email_2_enabled && enrollment.email_1_sent_at && !enrollment.email_2_sent_at) {
          const email1Date = new Date(enrollment.email_1_sent_at);
          const email2Due = new Date(email1Date.getTime() + campaign.email_2_delay_days * 86400000);
          if (now >= email2Due) {
            // Generate coupon code
            const couponCode = `WB-${enrollment.id.substring(0, 8).toUpperCase()}`;
            try {
              // Create coupon
              await supabaseAdmin.from("coupons").insert({
                code: couponCode,
                discount_type: "percentage",
                discount_value: campaign.email_2_discount_percent,
                is_active: true,
                max_uses: 1,
                valid_from: now.toISOString(),
                valid_until: new Date(now.getTime() + campaign.email_2_discount_validity_days * 86400000).toISOString(),
              });

              await supabaseAdmin.functions.invoke("send-email", {
                body: {
                  to: enrollment.user_email || `user-${enrollment.user_id}@placeholder.local`,
                  subject: campaign.email_2_subject,
                  html: `<p>Avem ceva special pentru tine! Folosește codul <strong>${couponCode}</strong> pentru ${campaign.email_2_discount_percent}% reducere.</p>`,
                  type: "winback_2",
                },
              });
              await supabaseAdmin.from("winback_enrollments").update({
                email_2_sent_at: now.toISOString(),
                coupon_code: couponCode,
              }).eq("id", enrollment.id);
              emailsSent++;
            } catch {}
            continue;
          }
        }

        // Email 3: after delay from email 2
        if (campaign.email_3_enabled && enrollment.email_2_sent_at && !enrollment.email_3_sent_at) {
          const email2Date = new Date(enrollment.email_2_sent_at);
          const email3Due = new Date(email2Date.getTime() + (campaign.email_3_delay_days - campaign.email_2_delay_days) * 86400000);
          if (now >= email3Due) {
            const couponCode = enrollment.coupon_code || `WB-${enrollment.id.substring(0, 8).toUpperCase()}`;
            try {
              await supabaseAdmin.functions.invoke("send-email", {
                body: {
                  to: enrollment.user_email || `user-${enrollment.user_id}@placeholder.local`,
                  subject: campaign.email_3_subject,
                  html: `<p>Ultima noastră ofertă: ${campaign.email_3_discount_percent}% reducere${campaign.email_3_free_shipping ? " + transport gratuit" : ""}! Cod: <strong>${couponCode}</strong>. Oferta expiră în 48 ore.</p>`,
                  type: "winback_3",
                },
              });
              await supabaseAdmin.from("winback_enrollments").update({
                email_3_sent_at: now.toISOString(),
              }).eq("id", enrollment.id);
              emailsSent++;
            } catch {}
            continue;
          }
        }

        // If all 3 emails sent and still no conversion after reasonable time → mark lost
        if (enrollment.email_3_sent_at) {
          const email3Date = new Date(enrollment.email_3_sent_at);
          if (now.getTime() - email3Date.getTime() > 7 * 86400000) {
            await supabaseAdmin.from("winback_enrollments").update({ status: "lost" }).eq("id", enrollment.id);
            markedLost++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ enrolled, emailsSent, markedLost }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("winback-processor error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
