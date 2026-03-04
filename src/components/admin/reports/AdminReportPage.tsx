import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Package, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportType = "profit" | "top-products" | "slow-movers" | "customers" | "inventory" | "conversion" | "marketing" | "financial";

interface Props {
  type: ReportType;
  title: string;
  description: string;
}

export default function AdminReportPage({ type, title, description }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      switch (type) {
        case "top-products": {
          const { data: items } = await supabase.from("order_items").select("product_id, quantity, price, products(name)").limit(500);
          const agg: Record<string, { name: string; qty: number; revenue: number }> = {};
          (items || []).forEach((i) => {
            const id = i.product_id;
            if (!agg[id]) agg[id] = { name: (i.products as any)?.name || id, qty: 0, revenue: 0 };
            agg[id].qty += i.quantity;
            agg[id].revenue += i.price * i.quantity;
          });
          setData(Object.values(agg).sort((a, b) => b.revenue - a.revenue).slice(0, 20));
          break;
        }
        case "slow-movers": {
          const { data: products } = await supabase.from("products").select("id,name,stock,price").gt("stock", 0).order("stock", { ascending: false }).limit(50);
          // Products with stock but no recent sales
          setData((products || []).slice(0, 20));
          break;
        }
        case "customers": {
          const { data: profiles } = await supabase.from("profiles").select("id,created_at").limit(1000);
          const { data: orders } = await supabase.from("orders").select("user_id,total").limit(1000);
          const totalCustomers = profiles?.length || 0;
          const customersWithOrders = new Set(orders?.map((o) => o.user_id)).size;
          const totalRevenue = orders?.reduce((s, o) => s + (o.total || 0), 0) || 0;
          setStats({ totalCustomers, customersWithOrders, avgOrderValue: customersWithOrders ? (totalRevenue / customersWithOrders).toFixed(2) : 0, conversionRate: totalCustomers ? ((customersWithOrders / totalCustomers) * 100).toFixed(1) : 0 });
          break;
        }
        case "inventory": {
          const { data: products } = await supabase.from("products").select("id,name,stock,price").limit(1000);
          const totalValue = (products || []).reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0);
          const outOfStock = (products || []).filter((p) => (p.stock || 0) === 0).length;
          const lowStock = (products || []).filter((p) => p.stock > 0 && p.stock <= 5).length;
          setStats({ totalProducts: products?.length || 0, totalValue, outOfStock, lowStock });
          setData((products || []).filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 20));
          break;
        }
        case "financial": {
          const { data: orders } = await supabase.from("orders").select("total,status,created_at").limit(1000);
          const revenue = (orders || []).filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
          const cancelled = (orders || []).filter((o) => o.status === "cancelled").length;
          setStats({ totalOrders: orders?.length || 0, revenue, cancelled, avgOrder: orders?.length ? (revenue / orders.length).toFixed(2) : 0 });
          break;
        }
        default: {
          const { data: orders } = await supabase.from("orders").select("total,status").limit(500);
          const revenue = (orders || []).reduce((s, o) => s + (o.total || 0), 0);
          setStats({ totalOrders: orders?.length || 0, revenue });
        }
      }
      setLoading(false);
    };
    loadData();
  }, [type]);

  const handleExport = () => {
    const content = JSON.stringify({ type, stats, data }, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `raport-${type}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats).map(([key, val]) => (
              <Card key={key}>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-lg font-bold">{typeof val === "number" ? val.toLocaleString("ro-RO") : val}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalii</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                        <span className="text-sm font-medium">{item.name || `Item ${i + 1}`}</span>
                      </div>
                      <div className="text-right text-sm">
                        {item.revenue != null && <span className="font-semibold">{item.revenue.toLocaleString("ro-RO")} lei</span>}
                        {item.qty != null && <span className="text-muted-foreground ml-2">({item.qty} buc)</span>}
                        {item.stock != null && !item.revenue && <span className="font-medium">Stoc: {item.stock}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
