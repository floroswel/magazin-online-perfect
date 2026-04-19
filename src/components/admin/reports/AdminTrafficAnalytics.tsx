import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line,
} from "recharts";
import {
  Users, MousePointerClick, ShoppingCart, TrendingUp,
  ArrowUpRight, ArrowDownRight, ShoppingBag,
} from "lucide-react";
import PendingDataBanner from "@/components/admin/PendingDataBanner";

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

function getDaysAgo(days: number) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString(); }

export default function AdminTrafficAnalytics() {
  const [period, setPeriod] = useState("30");
  const cutoff = useMemo(() => getDaysAgo(Number(period)), [period]);
  const prevCutoff = useMemo(() => getDaysAgo(Number(period) * 2), [period]);

  const { data: orders = [] } = useQuery({
    queryKey: ["traffic-orders", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at, user_id")
        .gte("created_at", prevCutoff)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["traffic-profiles", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, created_at")
        .gte("created_at", prevCutoff);
      return data || [];
    },
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["traffic-carts", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("id, user_id, created_at")
        .gte("created_at", prevCutoff);
      return data || [];
    },
  });

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ["traffic-abandoned", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("abandoned_carts")
        .select("id, created_at, recovered, total")
        .gte("created_at", prevCutoff);
      return data || [];
    },
  });

  const currentOrders = orders.filter((o: any) => o.created_at >= cutoff);
  const prevOrders = orders.filter((o: any) => o.created_at < cutoff);
  const currentProfiles = profiles.filter((p: any) => p.created_at >= cutoff);
  const prevProfiles = profiles.filter((p: any) => p.created_at < cutoff);
  const currentCarts = cartItems.filter((c: any) => c.created_at >= cutoff);
  const currentAbandoned = abandonedCarts.filter((a: any) => a.created_at >= cutoff);

  const signups = currentProfiles.length;
  const signupsTrend = prevProfiles.length > 0 ? ((signups - prevProfiles.length) / prevProfiles.length) * 100 : 0;
  const ordersTrend = prevOrders.length > 0 ? ((currentOrders.length - prevOrders.length) / prevOrders.length) * 100 : 0;

  const addToCartUsers = new Set(currentCarts.map((c: any) => c.user_id)).size;
  const cartToOrderRate = addToCartUsers > 0 ? (currentOrders.length / addToCartUsers) * 100 : 0;
  const signupToOrderRate = signups > 0 ? (currentOrders.length / signups) * 100 : 0;

  const abandonedTotal = currentAbandoned.length;
  const abandonRate = abandonedTotal > 0
    ? ((abandonedTotal - currentAbandoned.filter((a: any) => a.recovered).length) / abandonedTotal) * 100
    : 0;
  const recoveredValue = currentAbandoned.filter((a: any) => a.recovered).reduce((s: number, a: any) => s + Number(a.total || 0), 0);

  // Daily chart — REAL DATA only
  const dailyMap: Record<string, { date: string; signups: number; orders: number; carts: number; revenue: number }> = {};
  const days = Number(period);
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { date: key, signups: 0, orders: 0, carts: 0, revenue: 0 };
  }
  currentProfiles.forEach((p: any) => {
    const day = p.created_at.slice(0, 10);
    if (dailyMap[day]) dailyMap[day].signups += 1;
  });
  currentOrders.forEach((o: any) => {
    const day = o.created_at.slice(0, 10);
    if (dailyMap[day]) {
      dailyMap[day].orders += 1;
      dailyMap[day].revenue += Number(o.total);
    }
  });
  currentCarts.forEach((c: any) => {
    const day = c.created_at.slice(0, 10);
    if (dailyMap[day]) dailyMap[day].carts += 1;
  });
  const dailyChart = Object.values(dailyMap);

  // Funnel — REAL DATA only (no estimated visits)
  const funnelData = [
    { name: "Conturi create", value: signups },
    { name: "Adăugat în coș", value: addToCartUsers },
    { name: "Comenzi plasate", value: currentOrders.length },
    { name: "Comenzi confirmate", value: currentOrders.filter((o: any) => ["confirmed", "shipping", "delivered"].includes(o.status)).length },
    { name: "Comenzi livrate", value: currentOrders.filter((o: any) => o.status === "delivered").length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">📊 Analitice Comportament</h2>
          <p className="text-sm text-muted-foreground">Date reale: conturi, coșuri, comenzi și conversie</p>
        </div>
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

      <PendingDataBanner
        title="Trafic web (page views, surse, dispozitive) — necesită integrare analytics"
        description="Aceste metrici nu pot fi calculate doar din baza de date. Conectează Google Analytics 4, Plausible sau un tabel page_views custom pentru a activa secțiunile de surse de trafic, dispozitive și pagini populare."
        integrationName="Google Analytics 4 / Plausible / page_views tracker"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard icon={Users} label="Conturi noi" value={String(signups)} trend={signupsTrend} />
        <KpiCard icon={MousePointerClick} label="Utilizatori cu coș" value={String(addToCartUsers)} subtitle={`${currentCarts.length} adăugări`} />
        <KpiCard icon={ShoppingCart} label="Comenzi" value={String(currentOrders.length)} trend={ordersTrend} />
        <KpiCard icon={TrendingUp} label="Coș → Comandă" value={`${cartToOrderRate.toFixed(1)}%`} subtitle="conversie reală" />
        <KpiCard icon={ShoppingBag} label="Coșuri abandonate" value={`${abandonRate.toFixed(0)}%`} subtitle={`${recoveredValue.toFixed(0)} RON recuperat`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Activitate zilnică</TabsTrigger>
          <TabsTrigger value="funnel">Funnel conversie</TabsTrigger>
          <TabsTrigger value="conversion">Rate conversie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Conturi, Coșuri & Comenzi zilnice (date reale)</CardTitle></CardHeader>
            <CardContent>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={dailyChart}>
                    <defs>
                      <linearGradient id="cartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={v => new Date(v).toLocaleDateString("ro-RO")}
                      formatter={(v: number, name: string) => {
                        const labels: Record<string, string> = { carts: "Adăugări coș", signups: "Conturi", orders: "Comenzi" };
                        return [v, labels[name] || name];
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="carts" stroke="hsl(var(--primary))" fill="url(#cartGrad)" />
                    <Line yAxisId="right" type="monotone" dataKey="signups" stroke="hsl(150, 60%, 45%)" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(0, 80%, 50%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Nicio dată în perioada selectată.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Funnel de Conversie (date reale)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((step, i) => {
                  const maxVal = funnelData[0].value || 1;
                  const pct = (step.value / maxVal) * 100;
                  const dropoff = i > 0 && funnelData[i - 1].value > 0
                    ? ((funnelData[i - 1].value - step.value) / funnelData[i - 1].value * 100).toFixed(1)
                    : null;
                  return (
                    <div key={step.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-foreground">{step.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{step.value.toLocaleString()}</span>
                          {dropoff && <Badge variant="outline" className="text-xs">-{dropoff}%</Badge>}
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-md overflow-hidden">
                        <div className="h-full rounded-md transition-all bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Funnel începe de la conturi create (nu de la vizite — nu există tracking de page views).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Cont → Comandă</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{signupToOrderRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{currentOrders.length} comenzi din {signups} conturi noi</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Coș → Comandă</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{cartToOrderRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{currentOrders.length} comenzi din {addToCartUsers} utilizatori cu coș</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Recuperare coșuri</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{(100 - abandonRate).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{recoveredValue.toFixed(0)} RON recuperat din {abandonedTotal} coșuri</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
