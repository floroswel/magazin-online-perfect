import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: schedules, error: fetchErr } = await supabase
      .from("scheduled_imports")
      .select("*")
      .eq("is_active", true);

    if (fetchErr) throw fetchErr;

    const now = new Date();
    const results: { id: string; name: string; status: string; inserted?: number; error?: string }[] = [];

    for (const schedule of schedules || []) {
      if (schedule.last_run_at) {
        const lastRun = new Date(schedule.last_run_at);
        const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);
        if (diffMinutes < schedule.interval_minutes) {
          results.push({ id: schedule.id, name: schedule.name, status: "skipped" });
          continue;
        }
      }

      try {
        const importUrl = `${supabaseUrl}/functions/v1/import-products`;
        const res = await fetch(importUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            feed_url: schedule.feed_url,
            import_mode: "create_and_update",
            price_mode: schedule.price_mode || "as_is",
            price_multiplier: schedule.price_multiplier || 1.0,
            price_margin: schedule.price_margin || 0,
            stock_only_sync: schedule.stock_only_sync || false,
            scheduled_import_id: schedule.id,
          }),
        });

        const data = await res.json();

        await supabase
          .from("scheduled_imports")
          .update({ last_run_at: now.toISOString(), last_result: data })
          .eq("id", schedule.id);

        results.push({
          id: schedule.id,
          name: schedule.name,
          status: data.success ? "success" : "error",
          inserted: data.inserted,
          error: data.error,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await supabase
          .from("scheduled_imports")
          .update({ last_run_at: now.toISOString(), last_result: { error: errorMsg } })
          .eq("id", schedule.id);
        results.push({ id: schedule.id, name: schedule.name, status: "error", error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare necunoscută" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
