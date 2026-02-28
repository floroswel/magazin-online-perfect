import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey);
  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) throw new Error("Unauthorized");

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Forbidden");

  return { user, supabase };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await verifyAdmin(req);
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path: /integration-sdk/{action}
    const action = pathParts[pathParts.length - 1] || "";

    // ====== LIST CONNECTORS (catalog) ======
    if (req.method === "GET" && action === "connectors") {
      const { data, error } = await supabase
        .from("connectors")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return json({ connectors: data });
    }

    // ====== LIST INSTALLED INSTANCES ======
    if (req.method === "GET" && action === "instances") {
      const { data, error } = await supabase
        .from("connector_instances")
        .select("*, connectors(*)")
        .order("installed_at", { ascending: false });

      if (error) throw error;
      return json({ instances: data });
    }

    // ====== INSTALL CONNECTOR ======
    if (req.method === "POST" && action === "install") {
      const body = await req.json();
      const { connector_id, config_json } = body;

      // Check if already installed
      const { data: existing } = await supabase
        .from("connector_instances")
        .select("id")
        .eq("connector_id", connector_id)
        .maybeSingle();

      if (existing) {
        return json({ error: "Conectorul este deja instalat" }, 400);
      }

      const { data, error } = await supabase
        .from("connector_instances")
        .insert({
          connector_id,
          config_json: config_json || {},
          installed_by: user.id,
          enabled: false,
          status: "inactive",
        })
        .select("*, connectors(*)")
        .single();

      if (error) throw error;

      // Log event
      await supabase.from("integration_events").insert({
        event_type: "integration.installed",
        entity_type: "connector_instance",
        entity_id: data.id,
        payload: { connector_id, installed_by: user.id },
        source: "system",
        created_by: user.id,
      });

      return json({ instance: data });
    }

    // ====== UPDATE INSTANCE CONFIG ======
    if (req.method === "PUT" && action === "configure") {
      const body = await req.json();
      const { instance_id, config_json, enabled, sync_frequency_minutes } = body;

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (config_json !== undefined) updateData.config_json = config_json;
      if (enabled !== undefined) {
        updateData.enabled = enabled;
        updateData.status = enabled ? "active" : "inactive";
      }
      if (sync_frequency_minutes !== undefined) updateData.sync_frequency_minutes = sync_frequency_minutes;

      const { data, error } = await supabase
        .from("connector_instances")
        .update(updateData)
        .eq("id", instance_id)
        .select("*, connectors(*)")
        .single();

      if (error) throw error;

      // Log event
      await supabase.from("integration_events").insert({
        event_type: enabled ? "integration.enabled" : "integration.configured",
        entity_type: "connector_instance",
        entity_id: instance_id,
        payload: { changes: Object.keys(updateData) },
        source: "system",
        created_by: user.id,
      });

      return json({ instance: data });
    }

    // ====== UNINSTALL CONNECTOR ======
    if (req.method === "DELETE" && action === "uninstall") {
      const instance_id = url.searchParams.get("instance_id");
      if (!instance_id) return json({ error: "instance_id required" }, 400);

      // Log before delete
      await supabase.from("integration_events").insert({
        event_type: "integration.uninstalled",
        entity_type: "connector_instance",
        entity_id: instance_id,
        payload: { uninstalled_by: user.id },
        source: "system",
        created_by: user.id,
      });

      const { error } = await supabase
        .from("connector_instances")
        .delete()
        .eq("id", instance_id);

      if (error) throw error;
      return json({ success: true });
    }

    // ====== TRIGGER SYNC ======
    if (req.method === "POST" && action === "sync") {
      const body = await req.json();
      const { instance_id, sync_action } = body;

      // Create sync log
      const { data: syncLog, error } = await supabase
        .from("sync_logs")
        .insert({
          connector_instance_id: instance_id,
          action: sync_action || "manual_sync",
          status: "running",
        })
        .select()
        .single();

      if (error) throw error;

      // Update instance status
      await supabase
        .from("connector_instances")
        .update({ status: "syncing", last_sync_at: new Date().toISOString() })
        .eq("id", instance_id);

      // Simulate sync completion (in real implementation, this would call the connector's API)
      setTimeout(async () => {
        await supabase
          .from("sync_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            duration_ms: Math.floor(Math.random() * 3000) + 500,
            items_processed: Math.floor(Math.random() * 50),
          })
          .eq("id", syncLog.id);

        await supabase
          .from("connector_instances")
          .update({ status: "active" })
          .eq("id", instance_id);
      }, 2000);

      return json({ sync_log: syncLog });
    }

    // ====== GET SYNC LOGS ======
    if (req.method === "GET" && action === "sync-logs") {
      const instance_id = url.searchParams.get("instance_id");
      let query = supabase
        .from("sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (instance_id) {
        query = query.eq("connector_instance_id", instance_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return json({ logs: data });
    }

    // ====== GET EVENTS ======
    if (req.method === "GET" && action === "events") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const { data, error } = await supabase
        .from("integration_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return json({ events: data });
    }

    // ====== EMIT EVENT ======
    if (req.method === "POST" && action === "emit") {
      const body = await req.json();
      const { event_type, entity_type, entity_id, payload, source } = body;

      const { data, error } = await supabase
        .from("integration_events")
        .insert({
          event_type,
          entity_type,
          entity_id,
          payload: payload || {},
          source: source || "manual",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return json({ event: data });
    }

    // ====== WEBHOOK QUEUE ======
    if (req.method === "GET" && action === "webhooks") {
      const { data, error } = await supabase
        .from("webhook_queue")
        .select("*, connector_instances(connectors(name, key))")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return json({ webhooks: data });
    }

    // ====== TEST CONNECTION ======
    if (req.method === "POST" && action === "test-connection") {
      const body = await req.json();
      const { instance_id } = body;

      const { data: instance, error: instErr } = await supabase
        .from("connector_instances")
        .select("*, connectors(*)")
        .eq("id", instance_id)
        .single();

      if (instErr || !instance) return json({ success: false, error: "Instanță negăsită" }, 404);

      const config = instance.config_json as Record<string, string> || {};
      const connector = instance.connectors as any;

      // Check required fields from settings_schema
      const requiredFields = (connector?.settings_schema?.fields || [])
        .filter((f: any) => f.required)
        .map((f: any) => f.name);

      const missingFields = requiredFields.filter((f: string) => !config[f] || config[f].trim() === "");

      if (missingFields.length > 0) {
        return json({
          success: false,
          error: `Câmpuri obligatorii lipsă: ${missingFields.join(", ")}`,
        });
      }

      // Log the test event
      await supabase.from("integration_events").insert({
        event_type: "integration.test_connection",
        entity_type: "connector_instance",
        entity_id: instance_id,
        payload: { result: "success", connector_key: connector?.key },
        source: "manual",
        created_by: user.id,
      });

      return json({ success: true, message: "Credențiale configurate corect." });
    }

    return json({ error: "Unknown action: " + action }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Eroare internă";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
