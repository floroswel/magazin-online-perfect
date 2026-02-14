import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin via auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check admin role using service role client
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { campaignId, subject, content } = await req.json();

    // Get active subscribers
    const { data: subscribers, error: subErr } = await adminClient
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subErr) throw subErr;
    if (!subscribers || subscribers.length === 0) {
      throw new Error("No active subscribers found");
    }

    const emails = subscribers.map((s: any) => s.email);

    // Send via Resend (batch max 50)
    let sentCount = 0;
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MegaShop Newsletter <onboarding@resend.dev>",
          to: batch,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
              <div style="background:#cc0000;padding:24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:22px">🛒 MegaShop Newsletter</h1>
              </div>
              <div style="padding:24px">
                ${content}
              </div>
              <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#999">
                <p>Ai primit acest email pentru că ești abonat la newsletterul MegaShop.</p>
              </div>
            </div>`,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        console.error("Resend batch error:", resData);
      } else {
        sentCount += batch.length;
      }
    }

    // Update campaign status
    if (campaignId) {
      await adminClient
        .from("newsletter_campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: sentCount })
        .eq("id", campaignId);
    }

    return new Response(JSON.stringify({ success: true, sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Newsletter send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
