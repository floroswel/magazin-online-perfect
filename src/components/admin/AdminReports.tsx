import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { TrendingUp, ShoppingCart, Package, Users, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";

const COLORS = ["hsl(0, 80%, 50%)", "hsl(42, 100%, 50%)", "hsl(210, 80%, 45%)", "hsl(150, 60%, 45%)", "hsl(280, 60%, 50%)", "hsl(30, 80%, 50%)"];

function getDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function KpiCard({ icon: Icon, label, value, subtitle, trend }: {
  icon: any; label: string; value: string; subtitle?: string; trend?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
            {(subtitle || trend !== undefined) && (
              <div className="flex items-center gap-1 mt-0.5">
                {trend !== undefined && (
                  <span className={`flex items-center text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const [period, setPeriod] = useState("30");

  const cutoff = useMemo(() => getDaysAgo(Number(period)), [period]);
  const prevCutoff = useMemo(() => getDaysAgo(Number(period) * 2), [period]);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-reports-orders", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at, payment_method, user_id, order_items(quantity, price, product_id, products(name, category_id))")
        .gte("created_at", prevCutoff)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-reports-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, stock, price");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-reports-profiles", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, created_at").gte("created_at", prevCutoff);
      if (error) throw error;
      return data || [];
    },
  });

  // Split current vs previous period
  const currentOrders = orders.filter((o: any) => o.created_at >= cutoff);
  const prevOrders = orders.filter((o: any) => o.created_at < cutoff);

  const totalRevenue = currentOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const prevRevenue = prevOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const totalOrdersCount = currentOrders.length;
  const prevOrdersCount = prevOrders.length;
  const ordersTrend = prevOrdersCount > 0 ? ((totalOrdersCount - prevOrdersCount) / prevOrdersCount) * 100 : 0;

  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const prevAvg = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;
  const avgTrend = prevAvg > 0 ? ((avgOrderValue - prevAvg) / prevAvg) * 100 : 0;

  const uniqueCustomers = new Set(currentOrders.map((o: any) => o.user_id)).size;
  const newProfiles = profiles.filter((p: any) => p.created_at >= cutoff).length;

  const lowStock = products.filter((p: any) => p.stock <= 5).length;
  const deliveredOrders = currentOrders.filter((o: any) => o.status === "delivered").length;
  const conversionRate = totalOrdersCount > 0 ? (deliveredOrders / totalOrdersCount) * 100 : 0;

  // Daily revenue chart
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
  currentOrders.forEach((o: any) => {
    const day = o.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
    dailyMap[day].revenue += Number(o.total);
    dailyMap[day].orders += 1;
  });
  const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Status pie
  const statusMap: Record<string, number> = {};
  currentOrders.forEach((o: any) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  const statusChart = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Payment pie
  const paymentMap: Record<string, number> = {};
  currentOrders.forEach((o: any) => {
    const m = o.payment_method || "ramburs";
    paymentMap[m] = (paymentMap[m] || 0) + 1;
  });
  const paymentChart = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

  // Top products
  const prodSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  currentOrders.forEach((o: any) => {
    o.order_items?.forEach((item: any) => {
      const name = item.products?.name || "Necunoscut";
      if (!prodSales[name]) prodSales[name] = { name, qty: 0, revenue: 0 };
      prodSales[name].qty += item.quantity;
      prodSales[name].revenue += Number(item.price) * item.quantity;
    });
  });
  const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // Customers new vs returning
  const firstOrderMap: Record<string, string> = {};
  orders.forEach((o: any) => {
    if (!firstOrderMap[o.user_id] || o.created_at < firstOrderMap[o.user_id]) {
      firstOrderMap[o.user_id] = o.created_at;
    }
  });
  const newCustomersOrders = currentOrders.filter((o: any) => firstOrderMap[o.user_id] >= cutoff).length;
  const returningOrders = totalOrdersCount - newCustomersOrders;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Rapoarte</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Ultimele 7 zile</SelectItem>
            <SelectItem value="30">Ultimele 30 zile</SelectItem>
            <SelectItem value="90">Ultimele 90 zile</SelectItem>
            <SelectItem value="365">Ultimul an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={TrendingUp} label="Venituri" value={`${totalRevenue.toFixed(0)} RON`} trend={revenueTrend} />
        <KpiCard icon={ShoppingCart} label="Comenzi" value={String(totalOrdersCount)} trend={ordersTrend} />
        <KpiCard icon={Package} label="Valoare medie" value={`${avgOrderValue.toFixed(0)} RON`} trend={avgTrend} />
        <KpiCard icon={Users} label="Clienți unici" value={String(uniqueCustomers)} subtitle={`${newProfiles} noi`} />
        <KpiCard icon={Percent} label="Rată livrare" value={`${conversionRate.toFixed(1)}%`} subtitle={`${lowStock} stoc scăzut`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="products">Produse</TabsTrigger>
          <TabsTrigger value="customers">Clienți</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue + Orders daily */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Venituri & Comenzi zilnice</CardTitle></CardHeader>
            <CardContent>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailyChart}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 80%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString("ro-RO")} formatter={(v: number, name: string) => [name === "revenue" ? `${v.toFixed(0)} RON` : v, name === "revenue" ? "Venituri" : "Comenzi"]} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(0, 80%, 50%)" fill="url(#revGrad)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(210, 80%, 45%)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nicio dată pentru perioada selectată.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Status Comenzi</CardTitle></CardHeader>
              <CardContent>
                {statusChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusChart} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio comandă.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Metode de Plată</CardTitle></CardHeader>
              <CardContent>
                {paymentChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={paymentChart} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {paymentChart.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio plată.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Produse (după venituri)</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(0)} RON`} />
                    <Bar dataKey="revenue" fill="hsl(42, 100%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Niciun produs vândut.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Clienți noi vs. recurenți</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Noi", value: newCustomersOrders },
                        { name: "Recurenți", value: returningOrders },
                      ]}
                      cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="hsl(210, 80%, 45%)" />
                      <Cell fill="hsl(150, 60%, 45%)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Statistici clienți</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clienți unici (perioadă)</span>
                  <span className="font-semibold text-foreground">{uniqueCustomers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conturi noi create</span>
                  <span className="font-semibold text-foreground">{newProfiles}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comenzi clienți noi</span>
                  <span className="font-semibold text-foreground">{newCustomersOrders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comenzi clienți recurenți</span>
                  <span className="font-semibold text-foreground">{returningOrders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valoare medie per client</span>
                  <span className="font-semibold text-foreground">{uniqueCustomers > 0 ? (totalRevenue / uniqueCustomers).toFixed(0) : 0} RON</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
