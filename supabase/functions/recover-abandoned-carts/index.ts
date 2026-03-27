import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if manual send for specific cart
    let body: any = {};
    try { body = await req.json(); } catch {}
    const isManual = body.manual === true;
    const manualCartId = body.cartId;

    // Load settings
    const { data: settingsRow } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "abandoned_cart_settings")
      .maybeSingle();
    
    const settings = (settingsRow?.value_json as any) || {
      enabled: true,
      abandon_minutes: 60,
      email_1_hours: 1,
      email_2_hours: 24,
      email_3_hours: 72,
      discount_percent: 5,
      min_cart_value: 50,
      exclude_recent_hours: 24,
    };

    if (!settings.enabled && !isManual) {
      return new Response(JSON.stringify({ message: "System disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load store settings for email sender
    const { data: storeSettings } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "store_settings")
      .maybeSingle();
    const store = (storeSettings?.value_json as any) || {};
    const senderEmail = store.sender_email || "noreply@ventuza.ro";
    const senderName = store.sender_name || store.store_name || "VENTUZA";
    const siteUrl = store.site_url || supabaseUrl.replace(".supabase.co", ".lovable.app");

    const now = new Date();
    const abandonThreshold = new Date(now.getTime() - settings.abandon_minutes * 60 * 1000).toISOString();

    let cartsToProcess: any[] = [];

    if (isManual && manualCartId) {
      // Manual send: get specific cart
      const { data } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("id", manualCartId)
        .single();
      if (data && !data.recovered && !data.lost) cartsToProcess = [data];
    } else {
      // Auto: find eligible carts
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("recovered", false)
        .eq("lost", false)
        .lt("last_activity_at", abandonThreshold)
        .not("user_email", "is", null)
        .limit(100);

      if (error) throw error;
      cartsToProcess = data || [];
    }

    // Filter by min cart value
    cartsToProcess = cartsToProcess.filter(c => (c.total || 0) >= settings.min_cart_value);

    let sent = 0;
    const results: string[] = [];

    for (const cart of cartsToProcess) {
      if (!cart.user_email) continue;

      // Check if customer purchased recently
      if (!isManual && settings.exclude_recent_hours > 0) {
        const recentCutoff = new Date(now.getTime() - settings.exclude_recent_hours * 3600 * 1000).toISOString();
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", cart.user_id)
          .gte("created_at", recentCutoff);
        if ((count || 0) > 0) {
          // Customer bought recently, mark as recovered
          await supabase.from("abandoned_carts").update({
            recovered: true,
            recovered_at: now.toISOString(),
            status: "recovered",
          }).eq("id", cart.id);
          results.push(`${cart.user_email}: purchased recently, auto-recovered`);
          continue;
        }
      }

      const items = Array.isArray(cart.items) ? cart.items : [];
      const lastActivity = new Date(cart.last_activity_at);
      const hoursSinceAbandon = (now.getTime() - lastActivity.getTime()) / (1000 * 3600);

      // Determine which email to send
      let emailNumber = 0;
      if (isManual) {
        // Send next unsent email
        if (!cart.email_1_sent_at) emailNumber = 1;
        else if (!cart.email_2_sent_at) emailNumber = 2;
        else if (!cart.email_3_sent_at) emailNumber = 3;
      } else {
        if (!cart.email_1_sent_at && hoursSinceAbandon >= settings.email_1_hours) emailNumber = 1;
        else if (cart.email_1_sent_at && !cart.email_2_sent_at && hoursSinceAbandon >= settings.email_2_hours) emailNumber = 2;
        else if (cart.email_2_sent_at && !cart.email_3_sent_at && hoursSinceAbandon >= settings.email_3_hours) emailNumber = 3;
      }

      if (emailNumber === 0) continue;

      // Generate recovery token if not exists
      let recoveryToken = cart.recovery_token;
      if (!recoveryToken) {
        recoveryToken = crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
        await supabase.from("abandoned_carts").update({
          recovery_token: recoveryToken,
          recovery_token_expires_at: expiresAt,
        }).eq("id", cart.id);
      }

      // Generate coupon for email 2 if needed
      let couponCode = cart.recovery_coupon_code;
      if (emailNumber >= 2 && !couponCode && settings.discount_percent > 0) {
        couponCode = `RECOVER-${cart.id.slice(0, 8).toUpperCase()}`;
        const validUntil = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

        await supabase.from("coupons").insert({
          code: couponCode,
          discount_type: "percentage",
          discount_value: settings.discount_percent,
          is_active: true,
          valid_until: validUntil,
          max_uses: 1,
          max_uses_per_customer: 1,
          description: `Recuperare coș abandonat - ${cart.user_email}`,
        });

        await supabase.from("abandoned_carts").update({
          recovery_coupon_code: couponCode,
        }).eq("id", cart.id);
      }

      const recoveryLink = `${siteUrl}/checkout/recover?token=${recoveryToken}`;

      // Build product list HTML
      const productListHtml = items.slice(0, 5).map((item: any) => `
        <tr>
          <td style="padding: 8px;">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />` : '<div style="width:60px;height:60px;background:#eee;border-radius:4px;"></div>'}
          </td>
          <td style="padding: 8px;">
            <p style="margin: 0; font-weight: 600;">${item.name || "Produs"}</p>
            <p style="margin: 4px 0 0; color: #666;">x${item.quantity || 1}</p>
          </td>
          <td style="padding: 8px; text-align: right; font-weight: 600;">
            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)} RON
          </td>
        </tr>
      `).join("");

      // Determine customer name from email
      const customerName = cart.user_email.split("@")[0];

      let subject = "";
      let bodyHtml = "";

      if (emailNumber === 1) {
        subject = `Ai uitat ceva în coș, ${customerName}! 🛒`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 8px;">Coșul tău te așteaptă!</h2>
              <p style="color: #555; margin: 0 0 24px;">Ai lăsat câteva produse în coș. Nu le pierde!</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                ${productListHtml}
                <tr style="border-top: 2px solid #eee;">
                  <td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px;">${(cart.total || 0).toFixed(2)} RON</td>
                </tr>
              </table>
              <a href="${recoveryLink}" style="display: inline-block; background: #0865F5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Finalizează comanda →
              </a>
            </div>
            <div style="padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">Dacă nu dorești să mai primești aceste emailuri, te rugăm să ne contactezi.</p>
            </div>
          </div>
        `;
      } else if (emailNumber === 2) {
        subject = `Produsele tale te așteaptă + ${settings.discount_percent}% reducere special pentru tine`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 8px;">Nu rata oferta specială! 🎁</h2>
              <p style="color: #555; margin: 0 0 16px;">Produsele din coșul tău sunt încă disponibile, iar pentru tine avem o reducere specială:</p>
              ${couponCode && settings.discount_percent > 0 ? `
              <div style="background: #f0f9ff; border: 2px dashed #0865F5; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #0865F5; font-weight: bold; font-size: 14px;">${settings.discount_percent}% REDUCERE</p>
                <p style="margin: 0; font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${couponCode}</p>
                <p style="margin: 4px 0 0; color: #999; font-size: 12px;">Valabil 48 de ore</p>
              </div>
              ` : ""}
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                ${productListHtml}
                <tr style="border-top: 2px solid #eee;">
                  <td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px;">${(cart.total || 0).toFixed(2)} RON</td>
                </tr>
              </table>
              <a href="${recoveryLink}" style="display: inline-block; background: #0865F5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Folosește reducerea →
              </a>
            </div>
            <div style="padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">Dacă nu dorești să mai primești aceste emailuri, te rugăm să ne contactezi.</p>
            </div>
          </div>
        `;
      } else if (emailNumber === 3) {
        // Get stock info for urgency
        const productIds = items.map((i: any) => i.product_id).filter(Boolean);
        let stockInfo: Record<string, number> = {};
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("id, stock")
            .in("id", productIds);
          if (products) {
            for (const p of products) stockInfo[p.id] = p.stock ?? 0;
          }
        }

        const urgentProductHtml = items.slice(0, 5).map((item: any) => {
          const stock = stockInfo[item.product_id] ?? 0;
          const stockLabel = stock <= 3 ? `⚠️ Doar ${stock} în stoc!` : stock <= 10 ? `${stock} în stoc` : "Disponibil";
          const stockColor = stock <= 3 ? "#e53e3e" : stock <= 10 ? "#dd6b20" : "#38a169";
          return `
            <tr>
              <td style="padding: 8px;">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />` : '<div style="width:60px;height:60px;background:#eee;border-radius:4px;"></div>'}
              </td>
              <td style="padding: 8px;">
                <p style="margin: 0; font-weight: 600;">${item.name || "Produs"}</p>
                <p style="margin: 4px 0 0; color: ${stockColor}; font-size: 12px; font-weight: 600;">${stockLabel}</p>
              </td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">
                ${((item.price || 0) * (item.quantity || 1)).toFixed(2)} RON
              </td>
            </tr>
          `;
        }).join("");

        subject = "Ultima șansă — stoc limitat! ⏰";
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 8px; color: #e53e3e;">Ultima șansă! ⏰</h2>
              <p style="color: #555; margin: 0 0 16px;">Produsele din coșul tău au stoc limitat. Nu rata ocazia!</p>
              ${couponCode && settings.discount_percent > 0 ? `
              <div style="background: #fff5f5; border: 2px solid #e53e3e; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0; color: #e53e3e; font-size: 13px;">Reducerea ta de <strong>${settings.discount_percent}%</strong> este încă valabilă: <strong style="font-family: monospace; font-size: 16px;">${couponCode}</strong></p>
              </div>
              ` : ""}
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                ${urgentProductHtml}
              </table>
              <a href="${recoveryLink}" style="display: inline-block; background: #e53e3e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Cumpără acum →
              </a>
            </div>
            <div style="padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">Acesta este ultimul email de reminder. Nu te vom mai contacta pentru acest coș.</p>
            </div>
          </div>
        `;
      }

      // Send email via Resend
      if (resendKey && subject) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${senderName} <${senderEmail}>`,
              to: [cart.user_email],
              subject,
              html: bodyHtml,
            }),
          });

          const emailData = await emailRes.json();

          // Log to email_logs
          await supabase.from("email_logs").insert({
            to_email: cart.user_email,
            subject,
            type: `abandoned_cart_email_${emailNumber}`,
            status: emailRes.ok ? "sent" : "failed",
            resend_id: emailData?.id || null,
            error_message: emailRes.ok ? null : JSON.stringify(emailData),
            from_email: senderEmail,
          });

          if (emailRes.ok) sent++;
        } catch (emailErr) {
          console.error(`Failed to send email to ${cart.user_email}:`, emailErr);
          await supabase.from("email_logs").insert({
            to_email: cart.user_email,
            subject,
            type: `abandoned_cart_email_${emailNumber}`,
            status: "failed",
            error_message: String(emailErr),
            from_email: senderEmail,
          });
          continue;
        }
      }

      // Update cart status
      const updateData: any = {
        recovery_email_sent: true,
        recovery_email_sent_at: now.toISOString(),
      };

      if (emailNumber === 1) {
        updateData.email_1_sent_at = now.toISOString();
        updateData.status = "email_1_sent";
      } else if (emailNumber === 2) {
        updateData.email_2_sent_at = now.toISOString();
        updateData.status = "email_2_sent";
      } else if (emailNumber === 3) {
        updateData.email_3_sent_at = now.toISOString();
        updateData.status = "email_3_sent";
      }

      await supabase.from("abandoned_carts").update(updateData).eq("id", cart.id);
      results.push(`${cart.user_email}: email ${emailNumber} sent`);
    }

    return new Response(
      JSON.stringify({ message: `Processed ${cartsToProcess.length} carts, sent ${sent} emails`, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
