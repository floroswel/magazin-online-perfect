import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const MOKKA_API_KEY = Deno.env.get("MOKKA_API_KEY");
    if (!MOKKA_API_KEY) {
      throw new Error("MOKKA_API_KEY is not configured");
    }

    const MOKKA_API_URL = Deno.env.get("MOKKA_API_URL") || "https://demo-backend.mokka.ro";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...payload } = await req.json();

    if (action === "create_application") {
      // Create a Mokka payment application
      const { order_id, amount, items, customer, redirect_url } = payload;

      const mokkaPayload = {
        amount: Math.round(amount * 100), // cents
        currency: "RON",
        order_id,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
        })),
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        },
        redirect_url,
        callback_url: `${supabaseUrl}/functions/v1/mokka-checkout`,
      };

      const response = await fetch(`${MOKKA_API_URL}/api/v1/applications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MOKKA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mokkaPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Store application reference
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

      return new Response(JSON.stringify({ success: true, iframe_url: data.iframe_url || data.redirect_url, application_id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback" || action === "check_status") {
      // Handle Mokka callback / status check
      const { application_id } = payload;

      const response = await fetch(`${MOKKA_API_URL}/api/v1/applications/${application_id}`, {
        headers: {
          Authorization: `Bearer ${MOKKA_API_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mokka status check failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Update transaction status
      if (data.status) {
        const mappedStatus = data.status === "approved" ? "completed" : data.status === "rejected" ? "failed" : "pending";

        await supabase
          .from("payment_transactions")
          .update({
            status: mappedStatus,
            provider_response: data,
          })
          .eq("external_id", application_id);

        // If approved, update order payment status
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
