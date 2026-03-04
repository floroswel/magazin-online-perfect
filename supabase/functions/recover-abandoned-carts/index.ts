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

    // Find carts abandoned > 1 hour ago, not recovered, no email sent yet
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovered", false)
      .eq("recovery_email_sent", false)
      .lt("last_activity_at", oneHourAgo)
      .not("user_email", "is", null)
      .limit(50);

    if (error) throw error;
    if (!carts?.length) {
      return new Response(JSON.stringify({ message: "No abandoned carts to process", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const cart of carts) {
      if (!cart.user_email) continue;

      const items = Array.isArray(cart.items) ? cart.items : [];
      const itemList = items
        .slice(0, 5)
        .map((item: any) => `• ${item.name || "Produs"} x${item.quantity || 1}`)
        .join("\n");

      // Send via Resend if key available
      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "MegaShop <noreply@megashop.ro>",
              to: [cart.user_email],
              subject: "Ai uitat ceva în coș! 🛒",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Coșul tău te așteaptă!</h2>
                  <p>Observăm că ai lăsat câteva produse în coș. Nu le pierde!</p>
                  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <pre style="font-family: Arial; white-space: pre-wrap;">${itemList}</pre>
                    <p style="font-weight: bold; margin-top: 8px;">Total: ${(cart.total || 0).toFixed(2)} RON</p>
                  </div>
                  <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/cart" 
                     style="display: inline-block; background: #0865F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Finalizează comanda →
                  </a>
                  <p style="color: #999; font-size: 12px; margin-top: 24px;">
                    Dacă nu dorești să mai primești aceste emailuri, te rugăm să ne contactezi.
                  </p>
                </div>
              `,
            }),
          });
          sent++;
        } catch (emailErr) {
          console.error(`Failed to send email to ${cart.user_email}:`, emailErr);
          continue;
        }
      }

      // Mark as sent
      await supabase
        .from("abandoned_carts")
        .update({
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
        })
        .eq("id", cart.id);
    }

    return new Response(
      JSON.stringify({ message: `Processed ${carts.length} carts, sent ${sent} emails` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
