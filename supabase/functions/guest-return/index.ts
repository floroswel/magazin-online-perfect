const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    // ACTION 1: Lookup order by order_number + email
    if (action === "lookup") {
      const { order_number, email } = body;
      if (!order_number || !email) {
        return new Response(JSON.stringify({ error: "Număr comandă și email sunt obligatorii" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedOrder = order_number.trim();

      // Find order by order_number and user_email
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(id, product_id, quantity, price)")
        .eq("order_number", trimmedOrder)
        .ilike("user_email", trimmedEmail)
        .in("status", ["delivered", "completed", "livrat"])
        .maybeSingle();

      if (error || !order) {
        return new Response(JSON.stringify({ error: "Nu am găsit o comandă livrată cu aceste date. Verifică numărul comenzii și emailul." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if return already exists
      const { data: existingReturn } = await supabaseAdmin
        .from("returns")
        .select("id")
        .eq("order_id", order.id)
        .not("status", "in", '("rejected","cancelled")')
        .maybeSingle();

      if (existingReturn) {
        return new Response(JSON.stringify({ error: "Această comandă are deja o cerere de retur activă." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check 30-day window
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(order.created_at) < thirtyDaysAgo) {
        return new Response(JSON.stringify({ error: "Perioada de retur de 30 de zile a expirat pentru această comandă." }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enrich order_items with product names from products table
      const productIds = (order.order_items || []).map((i: any) => i.product_id).filter(Boolean);
      let productMap: Record<string, { name: string; image_url: string | null }> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("id, name, image_url")
          .in("id", productIds);
        if (products) {
          for (const p of products) {
            productMap[p.id] = { name: p.name, image_url: p.image_url };
          }
        }
      }

      // Return sanitized order
      return new Response(JSON.stringify({
        order: {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total: order.total,
          status: order.status,
          user_id: order.user_id,
          shipping_address: order.shipping_address,
          order_items: (order.order_items || []).map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            product_name: productMap[i.product_id]?.name || "Produs",
            quantity: i.quantity,
            unit_price: i.price,
            image_url: productMap[i.product_id]?.image_url || null,
          })),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION 2: Submit guest return
    if (action === "submit") {
      const {
        order_id, guest_email, return_type, items, observation,
        refund_method, bank_holder, bank_iban, bank_name,
        courier_choice, pickup_address,
      } = body;

      if (!order_id || !guest_email || !items || !Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({ error: "Date incomplete" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate IBAN if bank refund
      if (refund_method === "bank" && bank_iban) {
        const cleanIban = bank_iban.replace(/\s/g, "").toUpperCase();
        if (!/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(cleanIban)) {
          return new Response(JSON.stringify({ error: "IBAN invalid. Formatul corect: RO + 2 cifre + 4 litere bancă + 16 caractere." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Verify order exists and matches email
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, user_id, user_email, status")
        .eq("id", order_id)
        .ilike("user_email", guest_email.trim().toLowerCase())
        .in("status", ["delivered", "completed", "livrat"])
        .maybeSingle();

      if (!order) {
        return new Response(JSON.stringify({ error: "Comanda nu a fost găsită sau nu este eligibilă pentru retur." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if return already exists for this order
      const { data: existingReturn } = await supabaseAdmin
        .from("returns")
        .select("id")
        .eq("order_id", order.id)
        .not("status", "in", '("rejected","cancelled")')
        .maybeSingle();

      if (existingReturn) {
        return new Response(JSON.stringify({ error: "Această comandă are deja o cerere de retur activă." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load settings for auto_approve
      const { data: settings } = await supabaseAdmin
        .from("return_form_settings")
        .select("auto_approve, return_shipping_cost, exchange_shipping_cost")
        .limit(1)
        .single();

      const autoApprove = settings?.auto_approve || false;
      const shippingCost = return_type === "return"
        ? (settings?.return_shipping_cost || 0)
        : (settings?.exchange_shipping_cost || 0);

      // Create return
      const { data: returnReq, error: returnErr } = await supabaseAdmin
        .from("returns")
        .insert({
          order_id: order.id,
          user_id: order.user_id,
          customer_id: order.user_id,
          type: return_type || "return",
          status: autoApprove ? "approved" : "pending",
          auto_approved: autoApprove,
          reason: items.map((i: any) => i.reason_text).filter(Boolean).join(", "),
          details: observation || "",
          items: items,
          refund_method: return_type === "return" ? (refund_method || "bank") : "none",
          bank_account_holder: refund_method === "bank" ? (bank_holder || null) : null,
          bank_iban: refund_method === "bank" ? (bank_iban || null) : null,
          bank_name: refund_method === "bank" ? (bank_name || null) : null,
          courier_pickup_by: courier_choice || "customer",
          pickup_address: pickup_address || null,
          return_shipping_cost_calculated: shippingCost,
        })
        .select()
        .single();

      if (returnErr) {
        console.error("Return insert error:", returnErr);
        return new Response(JSON.stringify({ error: "Eroare la crearea cererii de retur" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create return items
      const returnItems = items.map((item: any) => ({
        return_request_id: returnReq.id,
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        product_name: item.product_name || "Produs",
        quantity: item.quantity || 1,
        return_reason_id: item.reason_id || "",
        return_reason_text: item.reason_text || "",
        unit_price: item.unit_price || 0,
        total_value: (item.unit_price || 0) * (item.quantity || 1),
      }));

      await supabaseAdmin.from("return_request_items").insert(returnItems);

      // Create admin notification
      await supabaseAdmin.from("admin_notifications").insert({
        type: "return",
        title: "📦 Cerere retur nouă #" + returnReq.id.slice(0, 8),
        message: `Comanda #${order_id.slice(0, 8)} — ${guest_email} — ${items.length} produs(e)`,
        link: "/admin/orders/returns",
      });

      return new Response(JSON.stringify({
        success: true,
        return_id: returnReq.id,
        auto_approved: autoApprove,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acțiune necunoscută" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Guest return error:", err);
    return new Response(JSON.stringify({ error: "Eroare internă" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
