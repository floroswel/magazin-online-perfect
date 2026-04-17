import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { session_id, analytics, marketing, user_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash IP and User-Agent for privacy
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    
    const encoder = new TextEncoder();
    const ipHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(ip))))
      .map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    const uaHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(ua))))
      .map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

    // Upsert consent
    const { data, error } = await supabase.from("gdpr_consents").upsert({
      session_id,
      user_id: user_id || null,
      necessary: true,
      analytics: !!analytics,
      marketing: !!marketing,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" }).select("id").single();

    if (error) {
      // If upsert conflict fails, try insert
      const { data: inserted, error: insertErr } = await supabase.from("gdpr_consents").insert({
        session_id,
        user_id: user_id || null,
        necessary: true,
        analytics: !!analytics,
        marketing: !!marketing,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
      }).select("id").single();

      if (insertErr) throw insertErr;
      return new Response(JSON.stringify({ consent_id: inserted.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ consent_id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
