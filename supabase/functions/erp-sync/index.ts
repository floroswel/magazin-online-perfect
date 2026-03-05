import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Incoming webhook endpoint for ERP sync.
 * POST /erp-sync
 * 
 * Headers: X-API-Key: <configured API key>
 * 
 * Body JSON:
 *   { "type": "stock_update", "data": { "sku": "ABC", "quantity": 50 } }
 *   { "type": "price_update", "data": { "sku": "ABC", "price": 199.99, "old_price": 249.99 } }
 *   { "type": "order_status_update", "data": { "order_id": "...", "status": "invoiced" } }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json(null, 204);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // ─── Auth: check X-API-Key header against any configured ERP integration ───
  const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key") || "";
  
  if (!apiKey) {
    await logIncoming(supabase, "unknown", null, "failed", "Missing X-API-Key header");
    return json({ error: "Unauthorized: missing API key" }, 401);
  }

  // Find integration with matching API key
  const { data: integration } = await supabase
    .from("erp_integrations")
    .select("id, name, status")
    .eq("api_key", apiKey)
    .eq("status", "connected")
    .maybeSingle();

  if (!integration) {
    await logIncoming(supabase, "unknown", null, "failed", "Invalid API key");
    return json({ error: "Unauthorized: invalid API key" }, 401);
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      await logIncoming(supabase, type || "unknown", body, "failed", "Missing type or data");
      return json({ error: "Missing 'type' or 'data' in payload" }, 400);
    }

    let result: any = {};

    switch (type) {
      case "stock_update": {
        const { sku, quantity } = data;
        if (!sku || quantity === undefined) {
          await logIncoming(supabase, type, body, "failed", "Missing sku or quantity");
          return json({ error: "Missing sku or quantity" }, 400);
        }
        const { data: product, error } = await supabase
          .from("products")
          .select("id, stock, name")
          .eq("sku", sku)
          .maybeSingle();

        if (!product) {
          await logIncoming(supabase, type, body, "failed", `Product not found: ${sku}`);
          return json({ error: `Product not found for SKU: ${sku}` }, 404);
        }

        const oldStock = product.stock || 0;
        await supabase.from("products").update({ stock: quantity }).eq("id", product.id);

        // Log stock change
        await supabase.from("stock_change_log").insert({
          product_id: product.id,
          sku,
          old_value: oldStock,
          new_value: quantity,
          reason: "erp_sync",
          changed_by: null,
        });

        result = { updated: true, sku, old_stock: oldStock, new_stock: quantity };
        break;
      }

      case "price_update": {
        const { sku, price, old_price } = data;
        if (!sku || price === undefined) {
          await logIncoming(supabase, type, body, "failed", "Missing sku or price");
          return json({ error: "Missing sku or price" }, 400);
        }
        const { data: product } = await supabase
          .from("products")
          .select("id")
          .eq("sku", sku)
          .maybeSingle();

        if (!product) {
          await logIncoming(supabase, type, body, "failed", `Product not found: ${sku}`);
          return json({ error: `Product not found for SKU: ${sku}` }, 404);
        }

        const updateData: Record<string, any> = { price };
        if (old_price !== undefined) updateData.old_price = old_price;

        await supabase.from("products").update(updateData).eq("id", product.id);
        result = { updated: true, sku, price };
        break;
      }

      case "order_status_update": {
        const { order_id, order_number, status } = data;
        const identifier = order_id || order_number;
        if (!identifier || !status) {
          await logIncoming(supabase, type, body, "failed", "Missing order_id/order_number or status");
          return json({ error: "Missing order identifier or status" }, 400);
        }

        let query = supabase.from("orders").select("id, status").limit(1);
        if (order_id) query = query.eq("id", order_id);
        else query = query.eq("order_number", order_number);

        const { data: order } = await query.maybeSingle();

        if (!order) {
          await logIncoming(supabase, type, body, "failed", `Order not found: ${identifier}`);
          return json({ error: `Order not found: ${identifier}` }, 404);
        }

        await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", order.id);
        result = { updated: true, order_id: order.id, old_status: order.status, new_status: status };
        break;
      }

      default:
        await logIncoming(supabase, type, body, "failed", `Unknown type: ${type}`);
        return json({ error: `Unknown sync type: ${type}` }, 400);
    }

    // Log success
    await logIncoming(supabase, type, body, "success", null);

    // Also log to erp_sync_logs
    await supabase.from("erp_sync_logs").insert({
      integration_id: integration.id,
      integration_name: integration.name,
      sync_type: type,
      direction: "pull",
      records_total: 1,
      records_updated: 1,
      status: "success",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return json({ ok: true, ...result });
  } catch (err) {
    console.error("ERP sync error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    await logIncoming(supabase, "unknown", null, "failed", message);
    return json({ error: message }, 500);
  }
});

async function logIncoming(supabase: any, eventType: string, payload: any, status: string, errorMessage: string | null) {
  try {
    await supabase.from("erp_webhook_logs").insert({
      direction: "incoming",
      event_type: eventType,
      request_payload: payload,
      status,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error("Failed to log incoming webhook:", e);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
