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
    const { email, ip } = await req.json();
    if (!email && !ip) {
      return new Response(JSON.stringify({ blocked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load settings (configurable from admin)
    let maxAttempts = 5;
    let windowMinutes = 30;
    try {
      const { data: secSettings } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "security_settings")
        .maybeSingle();
      if (secSettings?.value_json) {
        const s = secSettings.value_json as any;
        if (s.max_login_attempts) maxAttempts = Number(s.max_login_attempts);
        if (s.lockout_duration_minutes) windowMinutes = Number(s.lockout_duration_minutes);
      }
    } catch (_) {}

    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Count recent failed attempts by IP
    const { count } = await supabase
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip || "unknown")
      .eq("success", false)
      .gte("attempted_at", since);

    if ((count || 0) >= maxAttempts) {
      return new Response(
        JSON.stringify({
          blocked: true,
          message: `Prea multe încercări eșuate. Încearcă din nou după ${windowMinutes} minute.`,
          minutesLeft: windowMinutes,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ blocked: false, attempts: count || 0, maxAttempts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Check login attempts error:", error);
    // On error, don't block — fail open
    return new Response(JSON.stringify({ blocked: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
