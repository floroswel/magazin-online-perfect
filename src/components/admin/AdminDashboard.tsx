import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
} from "recharts";

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediat",
  delivered: "Livrat",
  cancelled: "Anulat",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at, user_email, order_items(quantity)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-dashboard-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, price, image_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-dashboard-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, is_active");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const lowStockProducts = products.filter((p: any) => p.stock <= 5);
  const activeSubs = subscribers.filter((s: any) => s.is_active).length;

  const recentOrders = orders.slice(0, 5);

  // Today stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((s: number, o: any) => s + Number(o.total), 0);

  // Last 7 days chart data
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(subDays(new Date(), i));
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter((o: any) => {
        const d = new Date(o.created_at);
        return d >= dayStart && d <= dayEnd;
      });

      days.push({
        name: format(dayStart, "EEE dd", { locale: ro }),
        vanzari: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
        comenzi: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Venituri Totale</p>
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
                  Astăzi: <span className="text-blue-600 font-semibold">{todayOrders.length}</span>
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
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produse</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{products.length}</p>
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

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Abonați Newsletter</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{activeSubs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  În așteptare: <span className="text-amber-600 font-semibold">{pendingOrders} comenzi</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart — Last 7 Days */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Vânzări — Ultimele 7 zile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={last7DaysData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }}
                  axisLine={{ stroke: "hsl(220 13% 88%)" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toLocaleString("ro-RO")} RON`}
                  width={90}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid hsl(220 13% 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "vanzari"
                      ? `${value.toLocaleString("ro-RO")} RON`
                      : `${value} comenzi`,
                    name === "vanzari" ? "Vânzări" : "Comenzi",
                  ]}
                />
                <Legend
                  formatter={(value) => (value === "vanzari" ? "Vânzări (RON)" : "Comenzi")}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Bar yAxisId="left" dataKey="vanzari" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} name="vanzari" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="comenzi"
                  stroke="hsl(150 60% 40%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(150 60% 40%)", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6 }}
                  name="comenzi"
                />
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
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Vezi toate <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nicio comandă încă.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-card border flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        #{order.id.slice(0, 8)} — {order.user_email || "Client necunoscut"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{Number(order.total).toFixed(0)} RON</p>
                      <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Stoc Scăzut
              </CardTitle>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Produse <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Toate produsele au stoc suficient. ✅</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                    </div>
                    <Badge variant={p.stock === 0 ? "destructive" : "secondary"} className="text-xs shrink-0">
                      {p.stock === 0 ? "Epuizat" : `${p.stock} buc`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
