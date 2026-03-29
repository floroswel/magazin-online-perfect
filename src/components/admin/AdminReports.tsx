import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
} from "recharts";
import { TrendingUp, ShoppingCart, Package, Users, Percent, ArrowUpRight, ArrowDownRight, Download, AlertTriangle, DollarSign } from "lucide-react";

const COLORS = ["hsl(0, 80%, 50%)", "hsl(42, 100%, 50%)", "hsl(210, 80%, 45%)", "hsl(150, 60%, 45%)", "hsl(280, 60%, 50%)", "hsl(30, 80%, 50%)", "hsl(180, 60%, 45%)", "hsl(330, 70%, 50%)"];

function getDaysAgo(days: number) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString(); }

function KpiCard({ icon: Icon, label, value, subtitle, trend }: { icon: any; label: string; value: string; subtitle?: string; trend?: number }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-5 h-5 text-primary" /></div>
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
        .select("id, total, status, created_at, payment_method, user_id, discount_amount, order_items(quantity, price, product_id, products(name, category_id, brand, price, cost_price))")
        .gte("created_at", prevCutoff)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-reports-products"],
    queryFn: async () => { const { data } = await supabase.from("products").select("id, name, stock, price, cost_price, category_id") as any; return data || []; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-reports-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("id, name"); return data || []; },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-reports-profiles", period],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("user_id, created_at").gte("created_at", prevCutoff); return data || []; },
  });

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
  const totalDiscount = currentOrders.reduce((s: number, o: any) => s + Number(o.discount_amount || 0), 0);

  // Real profit calculation using cost_price from products
  const totalCost = currentOrders.reduce((s: number, o: any) => {
    return s + (o.order_items || []).reduce((is: number, item: any) => {
      const costPrice = item.products?.cost_price;
      const itemCost = costPrice ? costPrice * item.quantity : Number(item.price) * item.quantity * 0.6;
      return is + itemCost;
    }, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Daily revenue chart
  const dailyMap: Record<string, { date: string; revenue: number; orders: number; profit: number }> = {};
  currentOrders.forEach((o: any) => {
    const day = o.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0, profit: 0 };
    dailyMap[day].revenue += Number(o.total);
    dailyMap[day].orders += 1;
    dailyMap[day].profit += Number(o.total) * 0.4; // estimated profit
  });
  const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Status pie
  const statusMap: Record<string, number> = {};
  currentOrders.forEach((o: any) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  const statusChart = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Payment pie
  const paymentMap: Record<string, number> = {};
  currentOrders.forEach((o: any) => { paymentMap[o.payment_method || "ramburs"] = (paymentMap[o.payment_method || "ramburs"] || 0) + 1; });
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
  const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Category revenue
  const catRevenue: Record<string, number> = {};
  currentOrders.forEach((o: any) => {
    o.order_items?.forEach((item: any) => {
      const catId = item.products?.category_id;
      const catName = categories.find((c: any) => c.id === catId)?.name || "Necategorizat";
      catRevenue[catName] = (catRevenue[catName] || 0) + Number(item.price) * item.quantity;
    });
  });
  const categoryChart = Object.entries(catRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Brand revenue
  const brandRevenue: Record<string, number> = {};
  currentOrders.forEach((o: any) => {
    o.order_items?.forEach((item: any) => {
      const brand = item.products?.brand || "Fără brand";
      brandRevenue[brand] = (brandRevenue[brand] || 0) + Number(item.price) * item.quantity;
    });
  });
  const brandChart = Object.entries(brandRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Conversion funnel
  const funnelData = [
    { name: "Comenzi plasate", value: totalOrdersCount },
    { name: "În procesare", value: currentOrders.filter((o: any) => ["processing", "shipped", "delivered"].includes(o.status)).length },
    { name: "Expediate", value: currentOrders.filter((o: any) => ["shipped", "delivered"].includes(o.status)).length },
    { name: "Livrate", value: deliveredOrders },
  ];

  // Customers: new vs returning + LTV
  const firstOrderMap: Record<string, string> = {};
  orders.forEach((o: any) => { if (!firstOrderMap[o.user_id] || o.created_at < firstOrderMap[o.user_id]) firstOrderMap[o.user_id] = o.created_at; });
  const newCustomersOrders = currentOrders.filter((o: any) => firstOrderMap[o.user_id] >= cutoff).length;
  const returningOrders = totalOrdersCount - newCustomersOrders;

  // Customer LTV (per unique customer in period)
  const customerTotals: Record<string, number> = {};
  currentOrders.forEach((o: any) => { customerTotals[o.user_id] = (customerTotals[o.user_id] || 0) + Number(o.total); });
  const ltv = uniqueCustomers > 0 ? Object.values(customerTotals).reduce((s, v) => s + v, 0) / uniqueCustomers : 0;

  // Stock rotation (sold qty / avg stock)
  const stockRotation = products.length > 0 ? (Object.values(prodSales).reduce((s, p) => s + p.qty, 0) / products.length).toFixed(1) : "0";

  // Low stock products
  const lowStockProducts = products.filter((p: any) => p.stock <= 5 && p.stock > 0).slice(0, 10);
  const outOfStockProducts = products.filter((p: any) => p.stock <= 0).slice(0, 10);

  // CSV Export
  const exportCsv = () => {
    const headers = "Data,ID Comanda,Total,Cost,Profit,Status,Plata\n";
    const rows = currentOrders.map((o: any) => {
      const estCost = (Number(o.total) * 0.6).toFixed(2);
      const estProfit = (Number(o.total) * 0.4).toFixed(2);
      return `${o.created_at.slice(0, 10)},${o.id.slice(0, 8)},${o.total},${estCost},${estProfit},${o.status},${o.payment_method || "ramburs"}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `raport-${period}zile.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Rapoarte & Analiză</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Ultimele 7 zile</SelectItem>
              <SelectItem value="30">Ultimele 30 zile</SelectItem>
              <SelectItem value="90">Ultimele 90 zile</SelectItem>
              <SelectItem value="365">Ultimul an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard icon={TrendingUp} label="Venituri" value={`${totalRevenue.toFixed(0)} RON`} trend={revenueTrend} />
        <KpiCard icon={DollarSign} label="Profit brut" value={`${grossProfit.toFixed(0)} RON`} subtitle={`Marjă ${profitMargin.toFixed(0)}%`} />
        <KpiCard icon={ShoppingCart} label="Comenzi" value={String(totalOrdersCount)} trend={ordersTrend} />
        <KpiCard icon={Package} label="Valoare medie" value={`${avgOrderValue.toFixed(0)} RON`} trend={avgTrend} />
        <KpiCard icon={Users} label="Clienți unici" value={String(uniqueCustomers)} subtitle={`${newProfiles} noi`} />
        <KpiCard icon={Users} label="LTV mediu" value={`${ltv.toFixed(0)} RON`} subtitle="per client" />
        <KpiCard icon={Percent} label="Rată livrare" value={`${conversionRate.toFixed(1)}%`} subtitle={`${deliveredOrders} livrate`} />
        <KpiCard icon={AlertTriangle} label="Stoc scăzut" value={String(lowStock)} subtitle={`${outOfStockProducts.length} epuizate`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="products">Produse & Categorii</TabsTrigger>
          <TabsTrigger value="customers">Clienți & LTV</TabsTrigger>
          <TabsTrigger value="funnel">Conversie</TabsTrigger>
          <TabsTrigger value="stock">Stoc</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Venituri & Comenzi zilnice</CardTitle></CardHeader>
            <CardContent>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={dailyChart}>
                    <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 80%, 50%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(0, 80%, 50%)" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={v => new Date(v).toLocaleDateString("ro-RO")} formatter={(v: number, name: string) => [name === "revenue" ? `${v.toFixed(0)} RON` : v, name === "revenue" ? "Venituri" : "Comenzi"]} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(0, 80%, 50%)" fill="url(#revGrad)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(210, 80%, 45%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Nicio dată pentru perioada selectată.</p>}
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Status Comenzi</CardTitle></CardHeader>
              <CardContent>
                {statusChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={statusChart} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio comandă.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Metode de Plată</CardTitle></CardHeader>
              <CardContent>
                {paymentChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={paymentChart} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {paymentChart.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio plată.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <KpiCard icon={TrendingUp} label="Venituri totale" value={`${totalRevenue.toFixed(0)} RON`} />
            <KpiCard icon={Package} label="Cost produse" value={`${totalCost.toFixed(0)} RON`} />
            <KpiCard icon={DollarSign} label="Profit brut" value={`${grossProfit.toFixed(0)} RON`} subtitle={`Marjă ${profitMargin.toFixed(0)}%`} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Profit zilnic</CardTitle></CardHeader>
            <CardContent>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailyChart}>
                    <defs><linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={v => new Date(v).toLocaleDateString("ro-RO")} formatter={(v: number) => [`${v.toFixed(0)} RON`, "Profit"]} />
                    <Area type="monotone" dataKey="profit" stroke="hsl(150, 60%, 45%)" fill="url(#profGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Nicio dată.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
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
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Venituri per Categorie</CardTitle></CardHeader>
              <CardContent>
                {categoryChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(0)} RON`} />
                      <Bar dataKey="value" fill="hsl(210, 80%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio dată.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Venituri per Brand</CardTitle></CardHeader>
              <CardContent>
                {brandChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={brandChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(0)} RON`} />
                      <Bar dataKey="value" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Nicio dată.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Clienți noi vs. recurenți</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={[{ name: "Noi", value: newCustomersOrders }, { name: "Recurenți", value: returningOrders }]} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="hsl(210, 80%, 45%)" /><Cell fill="hsl(150, 60%, 45%)" />
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Statistici clienți & LTV</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {[
                  ["Clienți unici (perioadă)", uniqueCustomers],
                  ["Conturi noi create", newProfiles],
                  ["Comenzi clienți noi", newCustomersOrders],
                  ["Comenzi clienți recurenți", returningOrders],
                  ["LTV mediu per client", `${ltv.toFixed(0)} RON`],
                  ["Valoare medie per client", uniqueCustomers > 0 ? `${(totalRevenue / uniqueCustomers).toFixed(0)} RON` : "0 RON"],
                  ["Total discount-uri acordate", `${totalDiscount.toFixed(0)} RON`],
                  ["Rotație stoc (medie)", `${stockRotation} buc/produs`],
                ].map(([label, val], i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader><CardTitle className="text-sm">Funnel Conversie Comenzi</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-w-md mx-auto">
                {funnelData.map((step, i) => {
                  const pct = funnelData[0].value > 0 ? (step.value / funnelData[0].value) * 100 : 0;
                  return (
                    <div key={step.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.name}</span>
                        <span className="text-muted-foreground">{step.value} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-8 bg-muted rounded-md overflow-hidden">
                        <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Stoc scăzut (≤5 buc.)</CardTitle></CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? <p className="text-sm text-muted-foreground">Toate produsele au stoc suficient.</p> : (
                  <div className="space-y-2">
                    {lowStockProducts.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
                        <span className="truncate flex-1 mr-2">{p.name}</span>
                        <span className="font-bold text-yellow-600">{p.stock} buc.</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Epuizate (0 buc.)</CardTitle></CardHeader>
              <CardContent>
                {outOfStockProducts.length === 0 ? <p className="text-sm text-muted-foreground">Niciun produs epuizat.</p> : (
                  <div className="space-y-2">
                    {outOfStockProducts.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
                        <span className="truncate flex-1 mr-2">{p.name}</span>
                        <span className="font-bold text-destructive">Epuizat</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
