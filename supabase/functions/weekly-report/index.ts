import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // This week orders
    const { data: thisWeekOrders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, user_id")
      .gte("created_at", weekAgo)
      .neq("status", "cancelled");

    // Last week orders (for comparison)
    const { data: lastWeekOrders } = await supabase
      .from("orders")
      .select("id, total")
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo)
      .neq("status", "cancelled");

    const thisWeekRevenue = (thisWeekOrders || []).reduce((s, o) => s + (o.total || 0), 0);
    const lastWeekRevenue = (lastWeekOrders || []).reduce((s, o) => s + (o.total || 0), 0);
    const revenueChange = lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
      : "N/A";

    // Top 5 products by sales
    const { data: topProducts } = await supabase
      .from("order_items")
      .select("product_name, quantity")
      .gte("created_at", weekAgo)
      .order("quantity", { ascending: false })
      .limit(20);

    // Aggregate top products
    const productMap = new Map<string, number>();
    for (const item of topProducts || []) {
      const name = item.product_name || "Necunoscut";
      productMap.set(name, (productMap.get(name) || 0) + (item.quantity || 1));
    }
    const top5 = [...productMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Abandoned carts
    const { count: abandonedCount } = await supabase
      .from("abandoned_carts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .eq("recovered", false);

    const { count: recoveredCount } = await supabase
      .from("abandoned_carts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .eq("recovered", true);

    // New customers (profiles created this week)
    const { count: newCustomers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo);

    // Unique customers who ordered this week
    const uniqueOrderCustomers = new Set((thisWeekOrders || []).map(o => o.user_id)).size;

    // Get admin email
    const { data: adminSettings } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "email_settings")
      .maybeSingle();

    const adminEmail = (adminSettings?.value_json as any)?.admin_email
      || (adminSettings?.value_json as any)?.from_email
      || "admin@mamalucica.ro";

    const changeEmoji = Number(revenueChange) > 0 ? "📈" : Number(revenueChange) < 0 ? "📉" : "➡️";

    const topProductsHTML = top5.map(([name, qty], i) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #F5E6D3">${i + 1}. ${name}</td>
        <td style="padding:8px;border-bottom:1px solid #F5E6D3;text-align:right;font-weight:bold">${qty} buc</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FFFBEB;border-radius:12px;overflow:hidden;border:1px solid #F5E6D3">
        <div style="background:linear-gradient(135deg,#B45309,#D97706);padding:28px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">📊 Raport Săptămânal</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">${new Date(weekAgo).toLocaleDateString("ro-RO")} — ${now.toLocaleDateString("ro-RO")}</p>
        </div>
        <div style="padding:24px">
          <div style="display:flex;gap:12px;margin-bottom:20px">
            <div style="flex:1;background:#fff;padding:16px;border-radius:8px;text-align:center;border:1px solid #F5E6D3">
              <p style="margin:0;color:#78716C;font-size:12px">VENITURI</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#B45309">${thisWeekRevenue.toFixed(0)} RON</p>
              <p style="margin:4px 0 0;font-size:12px;color:${Number(revenueChange) >= 0 ? '#16a34a' : '#dc2626'}">${changeEmoji} ${revenueChange}% vs săpt. anterioară</p>
            </div>
            <div style="flex:1;background:#fff;padding:16px;border-radius:8px;text-align:center;border:1px solid #F5E6D3">
              <p style="margin:0;color:#78716C;font-size:12px">COMENZI</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#B45309">${(thisWeekOrders || []).length}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#78716C">vs ${(lastWeekOrders || []).length} săpt. anterioară</p>
            </div>
          </div>

          <h3 style="color:#1C1917;margin:20px 0 10px">🏆 Top 5 Produse</h3>
          <table style="width:100%;border-collapse:collapse">
            ${topProductsHTML || '<tr><td style="padding:8px;color:#78716C">Nicio vânzare</td></tr>'}
          </table>

          <div style="display:flex;gap:12px;margin-top:20px">
            <div style="flex:1;background:#FEF2F2;padding:12px;border-radius:8px;text-align:center">
              <p style="margin:0;font-size:12px;color:#78716C">🛒 Coșuri abandonate</p>
              <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#dc2626">${abandonedCount || 0}</p>
              <p style="margin:0;font-size:11px;color:#16a34a">${recoveredCount || 0} recuperate</p>
            </div>
            <div style="flex:1;background:#F0FDF4;padding:12px;border-radius:8px;text-align:center">
              <p style="margin:0;font-size:12px;color:#78716C">👤 Clienți noi</p>
              <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#16a34a">${newCustomers || 0}</p>
            </div>
            <div style="flex:1;background:#EFF6FF;padding:12px;border-radius:8px;text-align:center">
              <p style="margin:0;font-size:12px;color:#78716C">🔄 Au comandat</p>
              <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#2563eb">${uniqueOrderCustomers}</p>
            </div>
          </div>

          <div style="text-align:center;margin-top:24px">
            <a href="https://mamalucica.ro/admin" style="display:inline-block;background:#B45309;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
              Deschide Admin Dashboard →
            </a>
          </div>
        </div>
      </div>
    `;

    // Send via send-email
    await supabase.functions.invoke("send-email", {
      body: {
        type: "weekly_report",
        to: adminEmail,
        data: { html },
      },
    });

    return new Response(JSON.stringify({
      success: true,
      revenue: thisWeekRevenue,
      orders: (thisWeekOrders || []).length,
      revenueChange,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
