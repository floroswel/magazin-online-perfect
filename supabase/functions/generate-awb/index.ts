import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SAMEDAY_API = "https://api.sameday.ro";
const SAMEDAY_AUTH = "https://sameday.ro/api/authenticate";

const COURIER_TRACKING_URLS: Record<string, string> = {
  fan_courier: "https://www.fancourier.ro/awb-tracking/?metession=",
  sameday: "https://www.sameday.ro/tracking?awb=",
  cargus: "https://app.urgentcargus.ro/Private/Tracking.aspx?CodBara=",
  dpd: "https://tracking.dpd.ro/?shipmentNumber=",
  gls: "https://gls-group.com/RO/ro/urmarire-colete?match=",
};

async function getSamedayToken(username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(SAMEDAY_AUTH, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch { return null; }
}

async function createSamedayAWB(token: string, order: any, courierConfig: any): Promise<{ awb: string; pdfUrl: string; estimatedDelivery: string } | null> {
  const addr = (order.shipping_address || {}) as any;
  const totalWeight = (order.order_items || []).reduce((sum: number, item: any) => {
    return sum + (item.products?.weight || 0.5) * item.quantity;
  }, 0);

  const isRamburs = order.payment_method === "ramburs" || order.payment_method === "cash";
  const codAmount = isRamburs ? Number(order.total || 0) : 0;

  const serviceId = courierConfig?.settings?.service_id || 7; // 7 = Standard
  const pickupPointId = courierConfig?.settings?.pickup_point_id || 1;

  const payload = {
    pickupPoint: pickupPointId,
    contactPerson: null,
    packageType: 0, // parcel
    packageNumber: 1,
    packageWeight: Math.max(0.1, totalWeight),
    service: serviceId,
    cashOnDelivery: codAmount,
    cashOnDeliveryReturns: codAmount > 0 ? 1 : 0, // bank transfer
    insuredValue: Number(order.total || 0),
    thirdPartyPickup: 0,
    observation: `Comanda #${order.order_number || order.id?.slice(0, 8)}`,
    priceObservation: "",
    clientObservation: "",
    recipient: {
      name: addr.fullName || addr.full_name || "Client",
      phoneNumber: addr.phone || "0700000000",
      address: addr.address || "N/A",
      cityString: addr.city || "Bucuresti",
      countyString: addr.county || "Bucuresti",
      postalCode: addr.postalCode || addr.postal_code || "",
      email: order.user_email || "",
    },
  };

  const res = await fetch(`${SAMEDAY_API}/api/awb`, {
    method: "POST",
    headers: {
      "X-AUTH-TOKEN": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sameday API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const awbNumber = data.awbNumber || data.awb_number || String(data.id);
  const pdfUrl = `${SAMEDAY_API}/api/awb/download/${awbNumber}`;
  const estimated = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

  return { awb: awbNumber, pdfUrl, estimatedDelivery: estimated };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const samedayApiKey = Deno.env.get("SAMEDAY_API_KEY");

  try {
    const { order_ids, courier } = await req.json();

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return new Response(JSON.stringify({ error: "order_ids required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let courierConfig = null;
    if (courier) {
      const { data } = await supabase.from("courier_configs").select("*").eq("courier", courier).eq("is_active", true).single();
      courierConfig = data;
    }

    // Try to get Sameday token if using sameday
    let samedayToken: string | null = null;
    const courierKey = courier || "sameday";
    if (courierKey === "sameday" && samedayApiKey) {
      const creds = courierConfig?.settings as any;
      if (creds?.username && creds?.password) {
        samedayToken = await getSamedayToken(creds.username, creds.password);
      }
    }

    const results: { order_id: string; awb: string; success: boolean; error?: string; pdf_url?: string }[] = [];

    for (const orderId of order_ids) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*, order_items(*, products(name, weight))")
          .eq("id", orderId)
          .single();

        if (!order) { results.push({ order_id: orderId, awb: "", success: false, error: "Comanda nu a fost găsită" }); continue; }
        if (order.tracking_number) { results.push({ order_id: orderId, awb: order.tracking_number, success: true }); continue; }

        let awb: string;
        let pdfUrl: string | null = null;
        let trackingUrl: string;

        // Use real Sameday API if token available
        if (courierKey === "sameday" && samedayToken) {
          const result = await createSamedayAWB(samedayToken, order, courierConfig);
          if (!result) throw new Error("Sameday AWB creation failed");
          awb = result.awb;
          pdfUrl = result.pdfUrl;
          trackingUrl = `https://www.sameday.ro/tracking?awb=${awb}`;
        } else {
          // Fallback: simulated AWB
          const prefix = courierKey === "fan_courier" ? "FC" : courierKey === "sameday" ? "SD" : courierKey === "cargus" ? "CG" : courierKey === "dpd" ? "DP" : "GL";
          awb = `${prefix}${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
          trackingUrl = (COURIER_TRACKING_URLS[courierKey] || "") + awb;
        }

        await supabase.from("orders").update({
          tracking_number: awb,
          courier: courierKey,
          tracking_url: trackingUrl,
          status: "shipped",
          shipping_status: "shipped",
          awb_generated_at: new Date().toISOString(),
        }).eq("id", orderId);

        await supabase.from("order_timeline").insert({
          order_id: orderId, action: "status_change", old_status: order.status, new_status: "shipped",
          note: `AWB generat: ${awb} (${courierConfig?.display_name || courierKey})`,
        });

        await supabase.from("tracking_events").insert({
          order_id: orderId, status: "picked_up",
          description: `AWB ${awb} generat, colet preluat de ${courierConfig?.display_name || courierKey}`,
          courier: courierKey,
        });

        if (order.user_email) {
          await supabase.functions.invoke("send-email", {
            body: { type: "tracking", to: order.user_email, data: { orderId: order.order_number || orderId.slice(0, 8), awb, trackingUrl, courier: courierConfig?.display_name || courierKey } },
          });
        }

        results.push({ order_id: orderId, awb, success: true, pdf_url: pdfUrl || undefined });
      } catch (err) {
        results.push({ order_id: orderId, awb: "", success: false, error: String(err) });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ results, summary: { total: order_ids.length, succeeded, failed } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
