// Health check edge function
// Probes: DB connectivity, recent error rate, edge function reachability.
// Writes results to public.uptime_log + public.health_check_results.
// Designed to be called by pg_cron every 5 minutes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  name: string;
  status: "ok" | "degraded" | "down";
  duration_ms: number;
  details: Record<string, unknown>;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; error: Error | null; ms: number }> {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { value, error: null, ms: Date.now() - t0 };
  } catch (e) {
    return { value: null, error: e as Error, ms: Date.now() - t0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const checks: CheckResult[] = [];

  // 1) DB connectivity (SELECT 1 against public.products)
  const dbProbe = await timed(async () => {
    const { error } = await admin.from("products").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw error;
    return true;
  });
  checks.push({
    name: "db_read",
    status: dbProbe.error ? "down" : dbProbe.ms > 1500 ? "degraded" : "ok",
    duration_ms: dbProbe.ms,
    details: dbProbe.error ? { error: dbProbe.error.message } : {},
  });

  // 2) Error rate in last 5 minutes (>20 errors → degraded, >100 → down)
  const errProbe = await timed(async () => {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await admin
      .from("error_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .in("level", ["error", "fatal"]);
    if (error) throw error;
    return count ?? 0;
  });
  const errCount = (errProbe.value as number) ?? 0;
  checks.push({
    name: "error_rate_5m",
    status: errProbe.error ? "degraded" : errCount > 100 ? "down" : errCount > 20 ? "degraded" : "ok",
    duration_ms: errProbe.ms,
    details: { error_count: errCount },
  });

  // 3) Storage reachability (list 1 object in product-images)
  const storageProbe = await timed(async () => {
    const { error } = await admin.storage.from("product-images").list("", { limit: 1 });
    if (error) throw error;
    return true;
  });
  checks.push({
    name: "storage",
    status: storageProbe.error ? "down" : storageProbe.ms > 2000 ? "degraded" : "ok",
    duration_ms: storageProbe.ms,
    details: storageProbe.error ? { error: storageProbe.error.message } : {},
  });

  // Persist health_check_results
  await admin.from("health_check_results").insert(
    checks.map((c) => ({
      check_name: c.name,
      status: c.status,
      details_json: c.details,
      duration_ms: c.duration_ms,
    })),
  );

  // Persist uptime_log entry (overall)
  const overall = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
    ? "degraded"
    : "ok";
  await admin.from("uptime_log").insert({
    endpoint: "internal://health-check",
    status_code: overall === "ok" ? 200 : overall === "degraded" ? 207 : 503,
    response_time_ms: checks.reduce((s, c) => s + c.duration_ms, 0),
    is_healthy: overall === "ok",
    error_message: overall === "ok" ? null : `Status: ${overall}`,
  });

  // ALERT: 2 consecutive failures → admin_notification
  if (overall !== "ok") {
    const { data: recent } = await admin
      .from("uptime_log")
      .select("is_healthy")
      .eq("endpoint", "internal://health-check")
      .order("created_at", { ascending: false })
      .limit(2);
    if (recent && recent.length === 2 && recent.every((r) => !r.is_healthy)) {
      await admin.from("admin_notifications").insert({
        type: "system",
        title: `🚨 Health check ${overall.toUpperCase()}`,
        message: `Eșecuri consecutive — verifică ${checks.filter((c) => c.status !== "ok").map((c) => c.name).join(", ")}`,
        link: "/admin/system/health",
      });
    }
  }

  return new Response(
    JSON.stringify({ overall, checks, timestamp: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
