import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, Users, TrendingUp, DollarSign, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KPI {
  label: string;
  value: string;
  change?: string;
  icon: any;
  color: string;
}

export default function AdminLiveKPI() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [todayOrders, yesterdayOrders, totalCustomers, recentCarts] = await Promise.all([
      supabase.from("orders").select("id, total", { count: "exact" }).gte("created_at", today),
      supabase.from("orders").select("id, total", { count: "exact" }).gte("created_at", yesterday).lt("created_at", today),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("abandoned_carts").select("id", { count: "exact" }).eq("status", "active"),
    ]);

    const todayRev = (todayOrders.data || []).reduce((s, o) => s + (o.total || 0), 0);
    const yesterdayRev = (yesterdayOrders.data || []).reduce((s, o) => s + (o.total || 0), 0);
    const revChange = yesterdayRev > 0 ? (((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(1) : "—";
    const todayCount = todayOrders.count || 0;
    const yesterdayCount = yesterdayOrders.count || 0;
    const ordChange = yesterdayCount > 0 ? (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1) : "—";
    const aov = todayCount > 0 ? (todayRev / todayCount).toFixed(0) : "0";

    setKpis([
      { label: "Venituri Azi", value: `${todayRev.toFixed(0)} RON`, change: revChange !== "—" ? `${revChange}%` : "—", icon: DollarSign, color: "text-green-600" },
      { label: "Comenzi Azi", value: `${todayCount}`, change: ordChange !== "—" ? `${ordChange}%` : "—", icon: ShoppingCart, color: "text-blue-600" },
      { label: "AOV", value: `${aov} RON`, icon: TrendingUp, color: "text-purple-600" },
      { label: "Clienți Total", value: `${totalCustomers.count || 0}`, icon: Users, color: "text-orange-600" },
      { label: "Coșuri Active", value: `${recentCarts.count || 0}`, icon: Eye, color: "text-red-600" },
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5" /> KPI în Timp Real</h1>
          <p className="text-sm text-muted-foreground">Actualizare automată la fiecare 60s · Ultimul update: {lastUpdate.toLocaleTimeString("ro-RO")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.change && (
                <Badge variant="outline" className={`mt-1 text-xs ${parseFloat(kpi.change) > 0 ? "text-green-600" : parseFloat(kpi.change) < 0 ? "text-red-600" : ""}`}>
                  {parseFloat(kpi.change) > 0 ? "+" : ""}{kpi.change} vs ieri
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
