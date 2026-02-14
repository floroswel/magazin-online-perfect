import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingCart, Package, Users } from "lucide-react";

const COLORS = ["hsl(0, 80%, 50%)", "hsl(42, 100%, 50%)", "hsl(210, 80%, 45%)", "hsl(150, 60%, 45%)", "hsl(280, 60%, 50%)"];

export default function AdminReports() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at, payment_method, order_items(quantity, price, products(name, category_id))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, stock, price");
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;
  const lowStock = products.filter((p: any) => p.stock <= 5).length;

  // Monthly revenue chart
  const monthlyData: Record<string, number> = {};
  orders.forEach((o: any) => {
    const month = new Date(o.created_at).toLocaleDateString("ro-RO", { month: "short", year: "2-digit" });
    monthlyData[month] = (monthlyData[month] || 0) + Number(o.total);
  });
  const revenueChart = Object.entries(monthlyData).slice(-6).map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));

  // Status breakdown
  const statusData: Record<string, number> = {};
  orders.forEach((o: any) => { statusData[o.status] = (statusData[o.status] || 0) + 1; });
  const statusChart = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  // Payment methods
  const paymentData: Record<string, number> = {};
  orders.forEach((o: any) => {
    const method = o.payment_method || "ramburs";
    paymentData[method] = (paymentData[method] || 0) + 1;
  });
  const paymentChart = Object.entries(paymentData).map(([name, value]) => ({ name, value }));

  // Top products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o: any) => {
    o.order_items?.forEach((item: any) => {
      const name = item.products?.name || "Necunoscut";
      if (!productSales[name]) productSales[name] = { name, qty: 0, revenue: 0 };
      productSales[name].qty += item.quantity;
      productSales[name].revenue += Number(item.price) * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Venituri Totale</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(0)} RON</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Comenzi</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrate</p>
                <p className="text-2xl font-bold">{deliveredOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stoc scăzut</p>
                <p className="text-2xl font-bold">{lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Venituri Lunare</CardTitle></CardHeader>
          <CardContent>
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v} RON`} />
                  <Bar dataKey="total" fill="hsl(0, 80%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Niciun venit înregistrat.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Status Comenzi</CardTitle></CardHeader>
          <CardContent>
            {statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nicio comandă.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 Produse (după venituri)</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(0)} RON`} />
                  <Bar dataKey="revenue" fill="hsl(42, 100%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Niciun produs vândut.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Metode de Plată</CardTitle></CardHeader>
          <CardContent>
            {paymentChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={paymentChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {paymentChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nicio plată.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
