import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMARTBILL_API = "https://ws.smartbill.ro/SBORO/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, order_id, config } = body;

    // config: { email, token, cif, warehouse, series_invoice, series_proforma, sandbox }
    // If not provided, load from app_settings
    let cfg = config;
    if (!cfg) {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "smartbill_settings")
        .maybeSingle();
      cfg = (settings?.value_json as any) || {};
    }

    const { email, token, cif } = cfg;
    if (!email || !token || !cif) {
      return json({ error: "SmartBill credentials not configured (email, token, cif)" }, 400);
    }

    const authHeader = "Basic " + btoa(`${email}:${token}`);

    switch (action) {
      case "test_connection": {
        const res = await fetch(`${SMARTBILL_API}/company/taxes?cif=${encodeURIComponent(cif)}`, {
          headers: { Authorization: authHeader, Accept: "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          return json({ error: `SmartBill error: ${JSON.stringify(data)}`, status: res.status }, 400);
        }
        return json({ ok: true, taxes: data });
      }

      case "create_invoice":
      case "create_proforma": {
        if (!order_id) return json({ error: "Missing order_id" }, 400);

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .select("*, order_items(*, products(id, name, sku, smartbill_code, smartbill_meas_unit, smartbill_vat_rate, price))")
          .eq("id", order_id)
          .single();

        if (orderErr || !order) return json({ error: "Order not found" }, 404);

        const addr = (order.shipping_address || order.billing_address || {}) as any;
        const billing = (order.billing_address || order.shipping_address || {}) as any;
        const isB2B = !!billing?.cui;
        const defaultMeasUnit = cfg.default_meas_unit || "buc";
        const defaultVatRate = cfg.default_vat_rate || 19;
        const series = action === "create_proforma"
          ? (cfg.series_proforma || "PROF")
          : (cfg.series_invoice || "FACT");

        // Build client
        const client: any = {
          name: isB2B ? (billing.company_name || billing.full_name) : (billing.full_name || addr.full_name || order.user_email),
          address: billing.address || addr.address || "",
          city: billing.city || addr.city || "",
          county: billing.county || addr.county || "",
          country: "Romania",
          email: order.user_email || "",
          phone: addr.phone || billing.phone || "",
          saveToDb: true,
        };
        if (isB2B) {
          client.vatCode = billing.cui;
          client.regCom = billing.reg_com || "";
          client.isTaxPayer = billing.cui?.startsWith("RO");
        }

        // Build products
        const products: any[] = [];
        for (const item of (order.order_items || [])) {
          const prod = item.products;
          const vatRate = prod?.smartbill_vat_rate || defaultVatRate;
          const vatName = vatRate === 19 ? "Normala" : vatRate === 9 ? "Redusa" : vatRate === 5 ? "Redusa2" : "SDD";
          products.push({
            name: prod?.name || "Produs",
            code: prod?.smartbill_code || prod?.sku || "",
            measuringUnitName: prod?.smartbill_meas_unit || defaultMeasUnit,
            currency: "RON",
            quantity: item.quantity,
            price: Number(item.price),
            isTaxIncluded: false,
            taxName: vatName,
            taxPercentage: vatRate,
            saveToDb: false,
            isService: false,
          });
        }

        // Optionally add shipping as line item
        if (cfg.include_shipping && Number(order.shipping_total) > 0) {
          products.push({
            name: cfg.shipping_product_name || "Transport",
            code: "TRANSPORT",
            measuringUnitName: "buc",
            currency: "RON",
            quantity: 1,
            price: Number(order.shipping_total),
            isTaxIncluded: false,
            taxName: "Normala",
            taxPercentage: defaultVatRate,
            saveToDb: false,
            isService: true,
          });
        }

        const invoicePayload = {
          companyVatCode: cif,
          client,
          seriesName: series,
          isDraft: false,
          currency: "RON",
          products,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          ...(action === "create_invoice" ? {} : { type: "proforma" }),
        };

        // Log the attempt
        const { data: logEntry } = await supabase.from("smartbill_sync_log").insert({
          order_id,
          action,
          status: "pending",
          request_payload: invoicePayload as any,
        }).select().single();

        const endpoint = action === "create_proforma"
          ? `${SMARTBILL_API}/estimate`
          : `${SMARTBILL_API}/invoice`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(invoicePayload),
        });

        const result = await res.json();

        if (!res.ok || result.errorText) {
          const errMsg = result.errorText || result.message || JSON.stringify(result);
          await supabase.from("smartbill_sync_log").update({
            status: "error",
            error_message: errMsg,
            response_payload: result as any,
          }).eq("id", logEntry?.id);

          await supabase.from("orders").update({ smartbill_status: "error" }).eq("id", order_id);
          return json({ error: errMsg }, 400);
        }

        const sbNumber = result.number || result.series + result.number;
        const sbUrl = result.url || null;

        // Update sync log
        await supabase.from("smartbill_sync_log").update({
          status: "success",
          smartbill_number: sbNumber,
          smartbill_url: sbUrl,
          response_payload: result as any,
        }).eq("id", logEntry?.id);

        // Update order
        await supabase.from("orders").update({
          smartbill_number: sbNumber,
          smartbill_url: sbUrl,
          smartbill_status: "synced",
        }).eq("id", order_id);

        // Save SmartBill client ID to profile if available
        if (result.client?.id && order.user_id) {
          await supabase.from("profiles").update({
            smartbill_client_id: String(result.client.id),
          }).eq("user_id", order.user_id);
        }

        return json({ ok: true, number: sbNumber, url: sbUrl, result });
      }

      case "create_storno": {
        if (!order_id) return json({ error: "Missing order_id" }, 400);

        const { data: order } = await supabase
          .from("orders")
          .select("smartbill_number")
          .eq("id", order_id)
          .single();

        if (!order?.smartbill_number) {
          return json({ error: "No SmartBill invoice to reverse" }, 400);
        }

        const series = cfg.series_invoice || "FACT";

        const { data: logEntry } = await supabase.from("smartbill_sync_log").insert({
          order_id,
          action: "create_storno",
          status: "pending",
        }).select().single();

        const res = await fetch(`${SMARTBILL_API}/invoice/reverse`, {
          method: "PUT",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            companyVatCode: cif,
            seriesName: series,
            number: order.smartbill_number.replace(/^[A-Z]+-/, ""),
          }),
        });

        const result = await res.json();

        if (!res.ok || result.errorText) {
          const errMsg = result.errorText || JSON.stringify(result);
          await supabase.from("smartbill_sync_log").update({
            status: "error",
            error_message: errMsg,
            response_payload: result as any,
          }).eq("id", logEntry?.id);
          return json({ error: errMsg }, 400);
        }

        await supabase.from("smartbill_sync_log").update({
          status: "success",
          smartbill_number: result.number,
          response_payload: result as any,
        }).eq("id", logEntry?.id);

        return json({ ok: true, storno_number: result.number });
      }

      case "download_pdf": {
        if (!order_id) return json({ error: "Missing order_id" }, 400);

        const { data: order } = await supabase
          .from("orders")
          .select("smartbill_number")
          .eq("id", order_id)
          .single();

        if (!order?.smartbill_number) {
          return json({ error: "No SmartBill invoice" }, 400);
        }

        const series = cfg.series_invoice || "FACT";
        const number = order.smartbill_number.replace(/^[A-Z]+-/, "");

        const res = await fetch(
          `${SMARTBILL_API}/invoice/pdf?cif=${encodeURIComponent(cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`,
          { headers: { Authorization: authHeader, Accept: "application/octet-stream" } }
        );

        if (!res.ok) {
          return json({ error: "Failed to download PDF from SmartBill" }, 400);
        }

        const pdfBytes = await res.arrayBuffer();
        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="SmartBill-${order.smartbill_number}.pdf"`,
          },
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("SmartBill error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
