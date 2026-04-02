import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendWithRetry(
  url: string,
  body: string,
  headers: Record<string, string>,
  maxRetries = 3
): Promise<{ status: number; ok: boolean; body: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body,
      });
      const text = await res.text();
      if (res.ok || attempt === maxRetries - 1) {
        return { status: res.status, ok: res.ok, body: text };
      }
    } catch (err) {
      if (attempt === maxRetries - 1) {
        return { status: 0, ok: false, body: String(err) };
      }
    }
    // Exponential backoff: 1s, 2s, 4s
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  return { status: 0, ok: false, body: "max retries" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event_type, payload } = await req.json();
    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get matching enabled webhooks
    const { data: webhooks, error } = await supabase
      .from("external_webhooks")
      .select("*")
      .eq("enabled", true)
      .or(`event_type.eq.${event_type},event_type.eq.custom_event`);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ dispatched: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const wh of webhooks) {
      const bodyObj = wh.include_payload
        ? { event: event_type, timestamp: new Date().toISOString(), data: payload }
        : { event: event_type, timestamp: new Date().toISOString() };

      const bodyStr = JSON.stringify(bodyObj);

      // Build headers
      const extraHeaders: Record<string, string> = {};
      if (wh.custom_headers && typeof wh.custom_headers === "object") {
        Object.assign(extraHeaders, wh.custom_headers);
      }
      if (wh.secret_key) {
        const signature = await hmacSign(wh.secret_key, bodyStr);
        extraHeaders["X-Webhook-Signature"] = `sha256=${signature}`;
      }

      const result = await sendWithRetry(wh.url, bodyStr, extraHeaders);

      // Update webhook status
      await supabase
        .from("external_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: result.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wh.id);

      results.push({
        webhook_id: wh.id,
        name: wh.name,
        status: result.status,
        ok: result.ok,
      });
    }

    return new Response(
      JSON.stringify({ dispatched: results.length, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
