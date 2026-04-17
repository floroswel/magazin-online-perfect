import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Public webhook receiver for courier tracking callbacks.
 * 
 * URL pattern: /webhook-receiver?carrier={carrier}&secret={webhook_secret}
 * 
 * Supported carriers:
 *   - fancourier  — Fan Courier tracking push
 *   - sameday     — Sameday status webhook
 *   - dpd         — DPD tracking events
 *   - cargus      — Cargus notifications
 *   - gls         — GLS status updates
 *   - generic     — Generic JSON payload
 * 
 * Security: Each courier config has a webhook_secret stored in courier_configs.config_json.
 *           The caller must pass ?secret=... matching that value.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const carrier = url.searchParams.get("carrier") || "generic";
  const secret = url.searchParams.get("secret") || "";

  try {
    // ─── Verify webhook secret ───
    const { data: courierConfig } = await supabase
      .from("courier_configs")
      .select("id, courier, config_json")
      .eq("courier", carrier)
      .eq("is_active", true)
      .maybeSingle();

    const configJson = (courierConfig?.config_json as Record<string, string>) || {};
    const expectedSecret = configJson.webhook_secret || "";

    if (!expectedSecret || secret !== expectedSecret) {
      console.error(`Webhook auth failed for carrier=${carrier}`);
      return json({ error: "Unauthorized: invalid webhook secret" }, 401);
    }

    // ─── Parse payload ───
    let payload: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = { raw: await req.text() };
    }

    // ─── Log to webhook_queue ───
    const idempotencyKey = `${carrier}-${JSON.stringify(payload).slice(0, 100)}-${Date.now()}`;

    // Check idempotency
    const { data: existing } = await supabase
      .from("webhook_queue")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return json({ ok: true, message: "Duplicate webhook ignored" });
    }

    // Find connector instance for this carrier
    const { data: connectorInstance } = await supabase
      .from("connector_instances")
      .select("id, connectors!inner(key)")
      .eq("connectors.key", carrier)
      .eq("enabled", true)
      .maybeSingle();

    await supabase.from("webhook_queue").insert({
      connector_instance_id: connectorInstance?.id || null,
      direction: "incoming",
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      payload,
      status: "pending",
      idempotency_key: idempotencyKey,
    });

    // ─── Process tracking update ───
    const result = await processTrackingWebhook(supabase, carrier, payload);

    // ─── Log integration event ───
    await supabase.from("integration_events").insert({
      event_type: "webhook.received",
      entity_type: "shipment",
      entity_id: result.awb || null,
      payload: {
        carrier,
        status: result.status,
        processed: result.processed,
      },
      source: carrier,
    });

    // ─── Update webhook_queue status ───
    if (result.processed) {
      await supabase
        .from("webhook_queue")
        .update({
          status: "delivered",
          processed_at: new Date().toISOString(),
          response_status: 200,
        })
        .eq("idempotency_key", idempotencyKey);
    }

    return json({ ok: true, ...result });
  } catch (err) {
    console.error("Webhook receiver error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});

// ─── Carrier-specific parsing ───

interface TrackingUpdate {
  awb: string;
  status: string;
  location?: string;
  description?: string;
  event_date?: string;
  processed: boolean;
}

async function processTrackingWebhook(
  supabase: any,
  carrier: string,
  payload: any
): Promise<TrackingUpdate> {
  let awb = "";
  let status = "";
  let location = "";
  let description = "";
  let eventDate = new Date().toISOString();

  switch (carrier) {
    case "fancourier": {
      // Fan Courier sends: { awb, status, location, date, details }
      awb = payload.awb || payload.AWB || payload.awb_number || "";
      status = mapFanCourierStatus(payload.status || payload.Status || "");
      location = payload.location || payload.Location || payload.oras || "";
      description = payload.details || payload.Details || payload.observatii || "";
      eventDate = payload.date || payload.Date || payload.data || eventDate;
      break;
    }
    case "sameday": {
      // Sameday sends: { awbNumber, statusId, statusName, transitLocation, ... }
      awb = payload.awbNumber || payload.awb || "";
      status = mapSamedayStatus(payload.statusId || payload.status || 0);
      location = payload.transitLocation || payload.county || "";
      description = payload.statusName || payload.reason || "";
      eventDate = payload.createdAt || payload.statusDate || eventDate;
      break;
    }
    case "dpd": {
      awb = payload.parcelNumber || payload.awb || "";
      status = mapGenericStatus(payload.status || payload.event || "");
      location = payload.depotName || payload.location || "";
      description = payload.eventDescription || payload.statusText || "";
      eventDate = payload.eventDate || eventDate;
      break;
    }
    case "cargus": {
      awb = payload.BarCode || payload.awb || "";
      status = mapGenericStatus(payload.Status || payload.event || "");
      location = payload.Location || "";
      description = payload.StatusDescription || "";
      eventDate = payload.EventDate || eventDate;
      break;
    }
    case "gls": {
      awb = payload.parcelNumber || payload.trackingNumber || "";
      status = mapGenericStatus(payload.eventCode || payload.status || "");
      location = payload.depotCity || payload.location || "";
      description = payload.eventDescription || "";
      eventDate = payload.eventTimestamp || eventDate;
      break;
    }
    default: {
      // Generic - try common field names
      awb = payload.awb || payload.tracking_number || payload.AWB || "";
      status = payload.status || "unknown";
      location = payload.location || "";
      description = payload.description || payload.message || "";
      eventDate = payload.date || payload.timestamp || eventDate;
    }
  }

  if (!awb) {
    return { awb: "", status: "unknown", processed: false, description: "No AWB found in payload" };
  }

  // ─── Find shipment by AWB ───
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id, status")
    .eq("awb_number", awb)
    .maybeSingle();

  if (!shipment) {
    return { awb, status, processed: false, description: `Shipment not found for AWB ${awb}` };
  }

  // ─── Insert shipment event ───
  await supabase.from("shipment_events").insert({
    shipment_id: shipment.id,
    status,
    location,
    description,
    event_date: eventDate,
    raw_data: payload,
  });

  // ─── Update shipment status ───
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "delivered") {
    updateData.delivered_at = eventDate;
  }

  await supabase
    .from("shipments")
    .update(updateData)
    .eq("id", shipment.id);

  // ─── Update order shipping_status ───
  if (shipment.order_id) {
    const orderStatus = status === "delivered" ? "delivered" : 
                        status === "in_transit" ? "shipped" :
                        status === "returned" ? "cancelled" : undefined;
    
    if (orderStatus) {
      await supabase
        .from("orders")
        .update({ 
          shipping_status: status,
          ...(orderStatus === "delivered" ? { status: "delivered" } : {}),
        })
        .eq("id", shipment.order_id);
    }
  }

  return { awb, status, location, description, event_date: eventDate, processed: true };
}

// ─── Status mapping functions ───

function mapFanCourierStatus(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  if (normalized.includes("livrat") || normalized.includes("delivered")) return "delivered";
  if (normalized.includes("predat") || normalized.includes("preluare")) return "picked_up";
  if (normalized.includes("depozit") || normalized.includes("hub") || normalized.includes("sosit")) return "in_transit";
  if (normalized.includes("expediat") || normalized.includes("plecat")) return "in_transit";
  if (normalized.includes("livrare") || normalized.includes("curier")) return "out_for_delivery";
  if (normalized.includes("refuzat") || normalized.includes("retur")) return "returned";
  if (normalized.includes("anulat")) return "cancelled";
  if (normalized.includes("avizat")) return "attempted";
  return "in_transit";
}

function mapSamedayStatus(statusId: number | string): string {
  const id = typeof statusId === "string" ? parseInt(statusId) : statusId;
  const map: Record<number, string> = {
    1: "picked_up",
    2: "in_transit",
    3: "in_transit",
    4: "out_for_delivery",
    5: "delivered",
    6: "returned",
    7: "cancelled",
    8: "attempted",
    9: "in_transit", // la depozit
    10: "out_for_delivery",
    35: "delivered", // livrat easybox
  };
  return map[id] || "in_transit";
}

function mapGenericStatus(raw: string): string {
  const normalized = (typeof raw === "string" ? raw : String(raw)).toLowerCase().trim();
  if (normalized.includes("deliver") || normalized.includes("livrat")) return "delivered";
  if (normalized.includes("transit") || normalized.includes("transport")) return "in_transit";
  if (normalized.includes("pickup") || normalized.includes("preluat")) return "picked_up";
  if (normalized.includes("return") || normalized.includes("retur")) return "returned";
  if (normalized.includes("cancel") || normalized.includes("anulat")) return "cancelled";
  if (normalized.includes("attempt") || normalized.includes("aviz")) return "attempted";
  if (normalized.includes("out_for") || normalized.includes("curier")) return "out_for_delivery";
  return "in_transit";
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
