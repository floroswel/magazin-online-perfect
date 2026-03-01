import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generate Mokka SHA1 signature per their spec:
 * 1. JSON.stringify the payload
 * 2. Escape all " with \"
 * 3. Append secret key
 * 4. SHA1 hash → 40 hex chars
 */
async function generateMokkaSignature(jsonData: Record<string, unknown>, secretKey: string): Promise<string> {
  const jsonString = JSON.stringify(jsonData);
  const escapedString = jsonString.replace(/"/g, '\\"');
  const stringToHash = escapedString + secretKey;
  const data = new TextEncoder().encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = new Uint8Array(hashBuffer);
  return new TextDecoder().decode(hexEncode(hashArray));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MOKKA_API_KEY = Deno.env.get("MOKKA_API_KEY");
    if (!MOKKA_API_KEY) {
      throw new Error("MOKKA_API_KEY is not configured");
    }

    const MOKKA_STORE_ID = Deno.env.get("MOKKA_STORE_ID");
    const MOKKA_API_URL = Deno.env.get("MOKKA_API_URL") || "https://demo-backend.mokka.ro";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...payload } = await req.json();

    if (action === "create_application") {
      const { order_id, amount, items, customer, redirect_url } = payload;

      const requestData: Record<string, unknown> = {
        callback_url: `${supabaseUrl}/functions/v1/mokka-checkout`,
        redirect_url: redirect_url || `${supabaseUrl}/functions/v1/mokka-checkout`,
        primary_phone: customer.phone,
        primary_email: customer.email,
        current_order: {
          order_id,
          amount: amount.toString(),
          items: items.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      };

      const signature = await generateMokkaSignature(requestData, MOKKA_API_KEY);

      const storeParam = MOKKA_STORE_ID ? `store_id=${MOKKA_STORE_ID}&` : "";
      const apiUrl = `${MOKKA_API_URL}/factoring/v1/precheck/auth?${storeParam}signature=${signature}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Store transaction
      await supabase
        .from("payment_transactions")
        .insert({
          order_id,
          amount,
          status: "pending",
          external_id: data.id || data.application_id,
          installments_provider: "mokka",
          installments_count: payload.installments || 3,
        });

      if (data.iframe_url) {
        return new Response(JSON.stringify({ success: true, iframeUrl: data.iframe_url, application_id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error("Mokka nu a returnat iframe_url");
      }
    }

    if (action === "finish") {
      const { order_id, contract, receipt } = payload;

      const requestData: Record<string, unknown> = {
        order_id,
        contract,
        receipt, // base64 PDF
      };

      const signature = await generateMokkaSignature(requestData, MOKKA_API_KEY);
      const storeParam = MOKKA_STORE_ID ? `store_id=${MOKKA_STORE_ID}&` : "";
      const apiUrl = `${MOKKA_API_URL}/factoring/v1/precheck/finish?${storeParam}signature=${signature}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka finish error [${response.status}]: ${JSON.stringify(data)}`);
      }

      if (data.status === 0) {
        // Mark order as paid
        await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", order_id);

        await supabase
          .from("payment_transactions")
          .update({ status: "completed", provider_response: data })
          .eq("order_id", order_id)
          .eq("installments_provider", "mokka");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error(`Mokka finish rejected: ${JSON.stringify(data)}`);
      }
    }

    if (action === "cancel") {
      const { order_id } = payload;

      const requestData: Record<string, unknown> = { order_id };

      const signature = await generateMokkaSignature(requestData, MOKKA_API_KEY);
      const storeParam = MOKKA_STORE_ID ? `store_id=${MOKKA_STORE_ID}&` : "";
      const apiUrl = `${MOKKA_API_URL}/factoring/v1/precheck/cancel?${storeParam}signature=${signature}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka cancel error [${response.status}]: ${JSON.stringify(data)}`);
      }

      if (data.status === 0) {
        await supabase
          .from("orders")
          .update({ payment_status: "cancelled", status: "cancelled" })
          .eq("id", order_id);

        await supabase
          .from("payment_transactions")
          .update({ status: "cancelled", provider_response: data })
          .eq("order_id", order_id)
          .eq("installments_provider", "mokka");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error(`Mokka cancel rejected: ${JSON.stringify(data)}`);
      }
    }

    if (action === "return") {
      const { order_id, amount, reason } = payload;

      const requestData: Record<string, unknown> = {
        order_id,
        amount: amount.toString(),
        reason,
      };

      const signature = await generateMokkaSignature(requestData, MOKKA_API_KEY);
      const storeParam = MOKKA_STORE_ID ? `store_id=${MOKKA_STORE_ID}&` : "";
      const apiUrl = `${MOKKA_API_URL}/factoring/v1/return?${storeParam}signature=${signature}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka return error [${response.status}]: ${JSON.stringify(data)}`);
      }

      if (data.status === 0) {
        await supabase
          .from("payment_transactions")
          .update({
            status: "refunded",
            refunded_amount: amount,
            provider_response: data,
          })
          .eq("order_id", order_id)
          .eq("installments_provider", "mokka");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error(`Mokka return rejected: ${JSON.stringify(data)}`);
      }
    }

    if (action === "callback" || action === "check_status") {
      const { application_id } = payload;

      const response = await fetch(`${MOKKA_API_URL}/api/v1/applications/${application_id}`, {
        headers: { Authorization: `Bearer ${MOKKA_API_KEY}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka status check failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      if (data.status) {
        const mappedStatus = data.status === "approved" ? "completed" : data.status === "rejected" ? "failed" : "pending";

        await supabase
          .from("payment_transactions")
          .update({ status: mappedStatus, provider_response: data })
          .eq("external_id", application_id);

        if (mappedStatus === "completed") {
          const { data: txn } = await supabase
            .from("payment_transactions")
            .select("order_id")
            .eq("external_id", application_id)
            .single();

          if (txn?.order_id) {
            await supabase
              .from("orders")
              .update({ payment_status: "paid" })
              .eq("id", txn.order_id);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, status: data.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Mokka checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
