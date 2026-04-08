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

    // Load return settings (used by both actions)
    const { data: settings } = await supabaseAdmin
      .from("return_form_settings")
      .select("*")
      .limit(1)
      .single();

    const returnWindowDays = settings?.extended_return_window_days || settings?.return_window_days || 14;

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

      // Check if return already exists (unless multiple returns allowed)
      if (!settings?.allow_multiple_returns_per_order) {
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
      }

      // Check return window based on delivered_at (or created_at as fallback)
      const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : new Date(order.created_at);
      const deadline = new Date(deliveryDate);
      deadline.setDate(deadline.getDate() + returnWindowDays);
      const now = new Date();

      if (now > deadline) {
        const daysAgo = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return new Response(JSON.stringify({ 
          error: `Perioada de retur de ${returnWindowDays} zile a expirat pentru această comandă. Termenul limită a fost ${deadline.toLocaleDateString("ro-RO")} (acum ${daysAgo} zile). Dacă consideri că ai dreptul la retur, te rugăm să ne contactezi.`,
          expired: true,
          deadline: deadline.toISOString(),
        }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enrich order_items with product names
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

      return new Response(JSON.stringify({
        order: {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          delivered_at: order.delivered_at || order.created_at,
          total: order.total,
          status: order.status,
          user_id: order.user_id,
          shipping_address: order.shipping_address,
          return_deadline: deadline.toISOString(),
          return_window_days: returnWindowDays,
          order_items: (order.order_items || []).map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            product_name: productMap[i.product_id]?.name || "Produs",
            quantity: i.quantity,
            unit_price: i.price,
            image_url: productMap[i.product_id]?.image_url || null,
          })),
        },
        gdpr: {
          require_consent: settings?.require_gdpr_consent ?? true,
          consent_text: settings?.gdpr_consent_text || "Sunt de acord cu prelucrarea datelor personale conform Politicii de Confidențialitate.",
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
        courier_choice, pickup_address, gdpr_consent,
      } = body;

      if (!order_id || !guest_email || !items || !Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({ error: "Date incomplete" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check GDPR consent
      if (settings?.require_gdpr_consent && !gdpr_consent) {
        return new Response(JSON.stringify({ error: "Trebuie să accepți prelucrarea datelor personale pentru a trimite cererea de retur." }), {
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

      // Verify order
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, user_id, user_email, status, delivered_at, created_at")
        .eq("id", order_id)
        .ilike("user_email", guest_email.trim().toLowerCase())
        .in("status", ["delivered", "completed", "livrat"])
        .maybeSingle();

      if (!order) {
        return new Response(JSON.stringify({ error: "Comanda nu a fost găsită sau nu este eligibilă pentru retur." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-check return window using delivered_at
      const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : new Date(order.created_at);
      const deadline = new Date(deliveryDate);
      deadline.setDate(deadline.getDate() + returnWindowDays);
      if (new Date() > deadline) {
        return new Response(JSON.stringify({ error: `Perioada de retur de ${returnWindowDays} zile a expirat.` }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check duplicate returns
      if (!settings?.allow_multiple_returns_per_order) {
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
      }

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
          gdpr_consent_given: gdpr_consent || false,
          return_deadline: deadline.toISOString().slice(0, 10),
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
        message: `Comanda #${order.user_email || guest_email} — ${items.length} produs(e) — ${return_type === "return" ? "Rambursare" : "Schimb"}`,
        link: "/admin/orders/returns",
      });

      // Send customer confirmation email
      try {
        const itemsList = items.map((i: any) => `• ${i.product_name} × ${i.quantity}`).join("\n");
        await supabaseAdmin.functions.invoke("send-email", {
          body: {
            to: guest_email.trim().toLowerCase(),
            subject: `Cererea ta de retur #${returnReq.id.slice(0, 8)} a fost ${autoApprove ? "aprobată" : "înregistrată"}`,
            html: `
              <h2>Cerere de retur ${autoApprove ? "aprobată" : "înregistrată"}</h2>
              <p>Salut,</p>
              <p>Cererea ta de retur pentru comanda a fost ${autoApprove ? "aprobată automat" : "înregistrată cu succes"}.</p>
              <p><strong>ID Retur:</strong> #${returnReq.id.slice(0, 8)}</p>
              <p><strong>Tip:</strong> ${return_type === "return" ? "Rambursare" : "Schimb produs"}</p>
              <p><strong>Produse:</strong></p>
              <pre>${itemsList}</pre>
              <p><strong>Termen limită retur:</strong> ${deadline.toLocaleDateString("ro-RO")}</p>
              ${autoApprove ? "<p>Poți trimite coletul imediat.</p>" : "<p>Vom reveni cu un răspuns în cel mai scurt timp posibil.</p>"}
              <hr/>
              <p style="font-size:12px;color:#888;">Acest email a fost trimis automat. Nu răspunde la acest email.</p>
            `,
          },
        });
        // Mark customer notified
        await supabaseAdmin.from("returns").update({ customer_notified_at: new Date().toISOString() }).eq("id", returnReq.id);
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
        // Don't fail the return request if email fails
      }

      // Notify admin via email if notify_on_created is enabled
      if (settings?.notify_on_created) {
        try {
          const adminEmail = Deno.env.get("RESEND_FROM_EMAIL") || "contact@mamalucica.ro";
          await supabaseAdmin.functions.invoke("send-email", {
            body: {
              to: adminEmail,
              subject: `[RETUR] Cerere nouă #${returnReq.id.slice(0, 8)} — ${guest_email}`,
              html: `
                <h2>📦 Cerere de retur nouă</h2>
                <p><strong>Client:</strong> ${guest_email}</p>
                <p><strong>Tip:</strong> ${return_type === "return" ? "Rambursare" : "Schimb"}</p>
                <p><strong>Produse:</strong> ${items.length} articol(e)</p>
                <p><strong>Status:</strong> ${autoApprove ? "Aprobat automat" : "În așteptare"}</p>
                <p><a href="${Deno.env.get("SITE_URL") || ""}/admin/orders/returns">Vezi în Admin →</a></p>
              `,
            },
          });
        } catch (adminEmailErr) {
          console.error("Admin email error:", adminEmailErr);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        return_id: returnReq.id,
        auto_approved: autoApprove,
        return_deadline: deadline.toISOString(),
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
