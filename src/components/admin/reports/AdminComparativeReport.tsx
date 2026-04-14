import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function AdminComparativeReport() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<{ metric: string; current: number; previous: number; change: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 86400000).toISOString();
    const prevStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();
    const prevEnd = currentStart;

    const [currentOrders, prevOrders] = await Promise.all([
      supabase.from("orders").select("id, total").gte("created_at", currentStart),
      supabase.from("orders").select("id, total").gte("created_at", prevStart).lt("created_at", prevEnd),
    ]);

    const cOrders = currentOrders.data || [];
    const pOrders = prevOrders.data || [];
    const cRev = cOrders.reduce((s, o) => s + (o.total || 0), 0);
    const pRev = pOrders.reduce((s, o) => s + (o.total || 0), 0);
    const cAOV = cOrders.length > 0 ? cRev / cOrders.length : 0;
    const pAOV = pOrders.length > 0 ? pRev / pOrders.length : 0;

    const calc = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : 0;

    setData([
      { metric: "Venituri (RON)", current: Math.round(cRev), previous: Math.round(pRev), change: calc(cRev, pRev) },
      { metric: "Nr. Comenzi", current: cOrders.length, previous: pOrders.length, change: calc(cOrders.length, pOrders.length) },
      { metric: "AOV (RON)", current: Math.round(cAOV), previous: Math.round(pAOV), change: calc(cAOV, pAOV) },
    ]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const chartData = data.map((d) => ({ name: d.metric, "Perioada curentă": d.current, "Perioada anterioară": d.previous }));
  const chartConfig = {
    "Perioada curentă": { label: "Curent", color: "hsl(var(--primary))" },
    "Perioada anterioară": { label: "Anterior", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Raport Comparativ</h1>
          <p className="text-sm text-muted-foreground">Compară perioade: curentă vs anterioară.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 zile vs 7 zile</SelectItem>
            <SelectItem value="30d">30 zile vs 30 zile</SelectItem>
            <SelectItem value="90d">90 zile vs 90 zile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.map((d) => {
              const isPos = d.change > 0;
              const isNeg = d.change < 0;
              const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
              return (
                <Card key={d.metric}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{d.metric}</p>
                    <div className="text-2xl font-bold">{d.current.toLocaleString()}</div>
                    <div className={`flex items-center gap-1 mt-1 text-sm ${isPos ? "text-green-600" : isNeg ? "text-red-600" : "text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                      <span>{isPos ? "+" : ""}{d.change.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground ml-1">vs {d.previous.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="pt-4">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Perioada curentă" fill="var(--color-Perioada curentă)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Perioada anterioară" fill="var(--color-Perioada anterioară)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
