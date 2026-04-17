import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    // New orders yesterday
    const { count: newOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    // Revenue yesterday (paid/confirmed/shipped/delivered)
    const { data: salesData } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .in("status", ["paid", "processing", "confirmed", "shipped", "delivered"]);
    const totalSales = salesData?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;

    // Pending orders
    const { count: pendingOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Low stock products
    const { count: lowStock } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lte("stock", 5)
      .gt("stock", 0);

    // Out of stock products
    const { count: outOfStock } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lte("stock", 0);

    // New reviews yesterday
    const { count: newReviews } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    // New customers yesterday
    const { count: newCustomers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    // Send email via send-email edge function
    await supabase.functions.invoke("send-email", {
      body: {
        type: "daily_report",
        to: "contact@mamalucica.ro",
        data: {
          date: dateStr,
          newOrders: newOrders || 0,
          totalSales: totalSales.toFixed(2),
          pendingOrders: pendingOrders || 0,
          lowStock: lowStock || 0,
          outOfStock: outOfStock || 0,
          newReviews: newReviews || 0,
          newCustomers: newCustomers || 0,
        },
      },
    });

    return new Response(JSON.stringify({ success: true, date: dateStr }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
