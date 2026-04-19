import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  RotateCcw,
  ArrowDownUp,
  Activity,
  Warehouse,
  Plus,
  FileText,
  Truck,
  MessageSquare,
  RefreshCw,
  Percent,
  Tag,
  BarChart3,
} from "lucide-react";
import { format, subDays, startOfDay, subMonths } from "date-fns";
import { ro } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import ManualOrderDialog from "./orders/ManualOrderDialog";
import { translateOrderStatus } from "@/lib/orderStatusLabels";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  confirmed: "bg-teal-100 text-teal-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
  returned: "bg-amber-100 text-amber-800",
  payment_failed: "bg-red-100 text-red-800",
};

const PIE_COLORS = [
  "hsl(220 70% 50%)",
  "hsl(150 60% 40%)",
  "hsl(30 90% 55%)",
  "hsl(280 60% 50%)",
  "hsl(0 70% 55%)",
  "hsl(180 50% 45%)",
];

type DateRange = "7d" | "30d" | "90d";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [manualOrderOpen, setManualOrderOpen] = useState(false);

  const rangeStart = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return startOfDay(subDays(new Date(), days)).toISOString();
  }, [dateRange]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, queryClient]);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-dash", "orders", rangeStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at, user_email, payment_method, shipping_method, order_items(quantity, product_id)")
        .gte("created_at", rangeStart)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-dash", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, low_stock_threshold, price, image_url, sku, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingReturns = [] } = useQuery({
    queryKey: ["admin-dash", "pending-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("id, order_id, status, reason, created_at, type, customer_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allReturns = [] } = useQuery({
    queryKey: ["admin-dash", "returns-range", rangeStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("id, created_at, status")
        .gte("created_at", rangeStart);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: unresolvedChats = 0 } = useQuery({
    queryKey: ["admin-dash", "unresolved-chats"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("chatbot_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: newCustomersToday = 0 } = useQuery({
    queryKey: ["admin-dash", "new-customers-today"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: warehouseStockData = [] } = useQuery({
    queryKey: ["admin-dash", "warehouse-stock"],
    queryFn: async () => {
      const { data: warehouses } = await supabase.from("warehouses").select("id, name, is_active").eq("is_active", true).order("name");
      if (!warehouses?.length) return [];
      const { data: ws } = await supabase.from("warehouse_stock").select("warehouse_id, product_id, quantity");
      const productIds = [...new Set((ws || []).map(r => r.product_id))];
      const { data: prods } = await supabase.from("products").select("id, price").in("id", productIds.length ? productIds : ["none"]);
      const priceMap = Object.fromEntries((prods || []).map(p => [p.id, Number(p.price)]));
      return warehouses.map(w => {
        const items = (ws || []).filter(r => r.warehouse_id === w.id);
        const totalQty = items.reduce((s, r) => s + r.quantity, 0);
        const totalValue = items.reduce((s, r) => s + r.quantity * (priceMap[r.product_id] || 0), 0);
        return { id: w.id, name: w.name, totalQty, totalValue };
      });
    },
  });

  const { data: recentStockMoves = [] } = useQuery({
    queryKey: ["admin-dash", "stock-moves"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("id, movement_type, quantity, product_id, created_at, notes")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Computed KPIs
  const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const activeProducts = products.filter((p: any) => p.status === "active" || !p.status).length;
  const lowStockProducts = products.filter((p: any) => p.stock != null && p.stock <= (p.low_stock_threshold ?? 5));
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;
  const conversionRate = orders.length > 0 ? ((deliveredOrders / orders.length) * 100).toFixed(1) : "0";
  const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length) : 0;

  // Sales chart data
  const chartData = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const result = [];
    const groupByWeek = days > 30;

    if (groupByWeek) {
      // Group by week for 90d
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = subDays(new Date(), i * 7);
        const weekStart = subDays(weekEnd, 6);
        const dayOrders = orders.filter((o: any) => {
          const d = new Date(o.created_at);
          return d >= startOfDay(weekStart) && d <= weekEnd;
        });
        const dayReturns = allReturns.filter((r: any) => {
          const d = new Date(r.created_at);
          return d >= startOfDay(weekStart) && d <= weekEnd;
        });
        result.push({
          name: format(weekStart, "dd MMM", { locale: ro }),
          vanzari: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
          comenzi: dayOrders.length,
          retururi: dayReturns.length,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = startOfDay(subDays(new Date(), i));
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayOrders = orders.filter((o: any) => {
          const d = new Date(o.created_at);
          return d >= dayStart && d <= dayEnd;
        });
        const dayReturns = allReturns.filter((r: any) => {
          const d = new Date(r.created_at);
          return d >= dayStart && d <= dayEnd;
        });

        result.push({
          name: format(dayStart, days <= 7 ? "EEE dd" : "dd MMM", { locale: ro }),
          vanzari: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
          comenzi: dayOrders.length,
          retururi: dayReturns.length,
        });
      }
    }
    return result;
  }, [orders, allReturns, dateRange]);

  // Revenue by payment method
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: any) => {
      const method = o.payment_method || "Necunoscut";
      map[method] = (map[method] || 0) + Number(o.total);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  // Top 10 products sold
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number; name: string; image: string }> = {};
    orders.forEach((o: any) => {
      (o.order_items || []).forEach((item: any) => {
        const pid = item.product_id;
        if (!pid) return;
        if (!map[pid]) {
          const prod = products.find((p: any) => p.id === pid);
          map[pid] = { qty: 0, revenue: 0, name: prod?.name || pid.slice(0, 8), image: prod?.image_url || "" };
        }
        map[pid].qty += item.quantity || 1;
        // Approximate revenue from order (we don't have per-item price in order_items)
      });
    });
    // Also estimate revenue from product price * qty
    Object.entries(map).forEach(([pid, val]) => {
      const prod = products.find((p: any) => p.id === pid);
      if (prod) val.revenue = val.qty * Number(prod.price);
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [orders, products]);

  // Activity feed
  const activityFeed = useMemo(() => {
    const items: { type: string; id: string; label: string; detail: string; time: string; icon: "order" | "return" | "stock" }[] = [];
    orders.slice(0, 10).forEach((o: any) => {
      items.push({
        type: "order", id: o.id,
        label: `Comandă #${o.id.slice(0, 8)}`,
        detail: `${Number(o.total).toFixed(0)} RON — ${translateOrderStatus(o.status)}`,
        time: o.created_at, icon: "order",
      });
    });
    pendingReturns.forEach((r: any) => {
      items.push({
        type: "return", id: r.id,
        label: `Retur #${r.id.slice(0, 8)}`,
        detail: `${r.reason || "Fără motiv"} — ${translateOrderStatus(r.status)}`,
        time: r.created_at, icon: "return",
      });
    });
    recentStockMoves.forEach((m: any) => {
      const sign = m.movement_type === "in" ? "+" : m.movement_type === "out" ? "-" : "";
      items.push({
        type: "stock", id: m.id,
        label: `Mișcare stoc`,
        detail: `${sign}${m.quantity} buc — ${m.notes || m.movement_type}`,
        time: m.created_at, icon: "stock",
      });
    });
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);
  }, [orders, pendingReturns, recentStockMoves]);

  const recentOrders = orders.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header: Date Range + Auto-refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Prezentare generală a magazinului</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-3 h-7">7 zile</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3 h-7">30 zile</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs px-3 h-7">90 zile</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1.5">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-75" />
            <span className="text-xs text-muted-foreground">Auto-refresh</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-dash"] })}>
            <RefreshCw className="w-3.5 h-3.5" /> Actualizează
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/products?action=new"><Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Adaugă produs</Button></Link>
        <Button size="sm" variant="default" className="h-8 gap-1 text-xs" onClick={() => setManualOrderOpen(true)}><ShoppingCart className="w-3.5 h-3.5" /> Comandă manuală</Button>
        <Link to="/admin/orders"><Button size="sm" variant="outline" className="h-8 gap-1 text-xs"><ShoppingCart className="w-3.5 h-3.5" /> Comenzi</Button></Link>
        <Link to="/admin/coupons"><Button size="sm" variant="outline" className="h-8 gap-1 text-xs"><Tag className="w-3.5 h-3.5" /> Adaugă cupon</Button></Link>
        <Link to="/admin/reports"><Button size="sm" variant="outline" className="h-8 gap-1 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Rapoarte</Button></Link>
      </div>
      <ManualOrderDialog open={manualOrderOpen} onOpenChange={setManualOrderOpen} />

      <DemoDataPanel />


      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Venituri</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{totalRevenue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Astăzi: <span className="text-emerald-600 font-semibold">{todayRevenue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Comenzi</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Astăzi: <span className="text-blue-600 font-semibold">{todayOrders.length}</span> | VOC: <span className="font-semibold">{avgOrderValue.toFixed(0)} RON</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produse Active</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{activeProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Stoc scăzut: <span className="text-amber-600 font-semibold">{lowStockProducts.length}</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                <Package className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Clienți Noi Azi</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{newCustomersToday}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rată conversie: <span className="text-cyan-600 font-semibold">{conversionRate}%</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Badges Row */}
      {(pendingReturns.length > 0 || unresolvedChats > 0 || lowStockProducts.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingReturns.length > 0 && (
            <Link to="/admin/orders/returns">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-orange-700 border-orange-300 bg-orange-50 hover:bg-orange-100 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" />
                {pendingReturns.length} cereri retur în așteptare
              </Badge>
            </Link>
          )}
          {unresolvedChats > 0 && (
            <Link to="/admin/support/chatbot">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                {unresolvedChats} conversații ChatBot nerezolvate
              </Badge>
            </Link>
          )}
          {lowStockProducts.length > 0 && (
            <Link to="/admin/stock/alerts">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockProducts.length} produse stoc scăzut
              </Badge>
            </Link>
          )}
        </div>
      )}

      {/* Sales + Returns Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Vânzări vs Retururi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} barSize={dateRange === "7d" ? 28 : 14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }} axisLine={{ stroke: "hsl(220 13% 88%)" }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toLocaleString("ro-RO")} RON`} width={90} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid hsl(220 13% 88%)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: number, name: string) => [
                    name === "vanzari" ? `${value.toLocaleString("ro-RO")} RON` : `${value}`,
                    name === "vanzari" ? "Vânzări" : name === "comenzi" ? "Comenzi" : "Retururi",
                  ]}
                />
                <Legend formatter={(v) => v === "vanzari" ? "Vânzări (RON)" : v === "comenzi" ? "Comenzi" : "Retururi"} iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="vanzari" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} name="vanzari" />
                <Line yAxisId="right" type="monotone" dataKey="comenzi" stroke="hsl(150 60% 40%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(150 60% 40%)", strokeWidth: 2, stroke: "white" }} name="comenzi" />
                <Line yAxisId="right" type="monotone" dataKey="retururi" stroke="hsl(0 70% 55%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "hsl(0 70% 55%)", strokeWidth: 2, stroke: "white" }} name="retururi" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Comenzi Recente</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="text-xs gap-1">Vezi toate <ArrowUpRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nicio comandă în perioada selectată.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order: any) => (
                  <Link key={order.id} to={`/admin/orders/${order.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-card border flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">#{order.id.slice(0, 8)} — {order.user_email || "Client necunoscut"}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{Number(order.total).toFixed(0)} RON</p>
                        <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>{translateOrderStatus(order.status)}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Stoc Scăzut</CardTitle>
              <Link to="/admin/stock/alerts">
                <Button variant="ghost" size="sm" className="text-xs gap-1">Vezi toate <ArrowUpRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Toate produsele au stoc suficient. ✅</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 8).map((p: any) => (
                  <Link key={p.id} to={`/admin/products?edit=${p.id}`} className="block">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p></div>
                      <Badge variant={p.stock === 0 ? "destructive" : "secondary"} className="text-xs shrink-0">{p.stock === 0 ? "Epuizat" : `${p.stock} buc`}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Payment Method */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              Venituri per Metodă Plată
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Niciun venit în perioada selectată.</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toLocaleString("ro-RO")} RON`} labelLine={false} fontSize={11}>
                      {paymentMethodData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString("ro-RO")} RON`, "Venituri"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Products */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-600" />
              Top 10 Produse Vândute
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nicio vânzare în perioada selectată.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center"><Package className="w-3.5 h-3.5 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{p.qty} buc</p>
                      <p className="text-[10px] text-muted-foreground">{p.revenue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Returns */}
      {pendingReturns.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-orange-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-500" />
                Cereri Retur în Așteptare
                <Badge variant="secondary" className="text-xs">{pendingReturns.length}</Badge>
              </CardTitle>
              <Link to="/admin/orders/returns">
                <Button variant="ghost" size="sm" className="text-xs gap-1">Gestionează <ArrowUpRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingReturns.slice(0, 5).map((r: any) => (
                <Link key={r.id} to="/admin/orders/returns" className="block">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><RotateCcw className="w-4 h-4 text-orange-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Retur #{r.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{r.reason || r.type || "Retur produs"}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{format(new Date(r.created_at), "dd MMM, HH:mm", { locale: ro })}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Stock Value */}
      {warehouseStockData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Warehouse className="w-4 h-4 text-violet-600" /> Stoc per Depozit</CardTitle>
              <Link to="/admin/stock/warehouses"><Button variant="ghost" size="sm" className="text-xs gap-1">Depozite <ArrowUpRight className="w-3 h-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {warehouseStockData.map((w: any) => (
                <div key={w.id} className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-medium truncate">{w.name}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold">{w.totalValue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</span>
                    <span className="text-xs text-muted-foreground">{w.totalQty} buc</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Activitate Live</CardTitle>
        </CardHeader>
        <CardContent>
          {activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nicio activitate recentă.</p>
          ) : (
            <div className="space-y-1">
              {activityFeed.map((item) => {
                const IconComp = item.icon === "order" ? ShoppingCart : item.icon === "return" ? RotateCcw : ArrowDownUp;
                const iconBg = item.icon === "order" ? "bg-blue-50 text-blue-600" : item.icon === "return" ? "bg-orange-50 text-orange-600" : "bg-violet-50 text-violet-600";
                return (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}><IconComp className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground shrink-0">{format(new Date(item.time), "dd MMM, HH:mm", { locale: ro })}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
