import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Crown, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerCLV {
  user_id: string;
  email: string;
  total_spent: number;
  order_count: number;
  avg_order: number;
  first_order: string;
  last_order: string;
  segment: string;
}

export default function AdminCLV() {
  const [customers, setCustomers] = useState<CustomerCLV[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgCLV: 0, topSpenders: 0, churnRisk: 0 });

  const load = async () => {
    setLoading(true);
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, user_email, total, created_at")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false });

    if (!orders) { setLoading(false); return; }

    const grouped = new Map<string, { email: string; totals: number[]; dates: string[] }>();
    orders.forEach((o) => {
      const uid = o.user_id!;
      if (!grouped.has(uid)) grouped.set(uid, { email: o.user_email || "—", totals: [], dates: [] });
      const g = grouped.get(uid)!;
      g.totals.push(o.total || 0);
      g.dates.push(o.created_at);
    });

    const now = Date.now();
    const ninetyDays = 90 * 86400000;
    const result: CustomerCLV[] = [];

    grouped.forEach((v, uid) => {
      const totalSpent = v.totals.reduce((a, b) => a + b, 0);
      const avgOrder = totalSpent / v.totals.length;
      const lastOrder = v.dates[0];
      const daysSinceLast = (now - new Date(lastOrder).getTime()) / 86400000;

      let segment = "Regular";
      if (totalSpent > 2000) segment = "VIP";
      else if (totalSpent > 1000) segment = "Top Spender";
      else if (daysSinceLast > 90) segment = "Churn Risk";

      result.push({
        user_id: uid,
        email: v.email,
        total_spent: totalSpent,
        order_count: v.totals.length,
        avg_order: avgOrder,
        first_order: v.dates[v.dates.length - 1],
        last_order: lastOrder,
        segment,
      });
    });

    result.sort((a, b) => b.total_spent - a.total_spent);

    const avgCLV = result.length > 0 ? result.reduce((s, c) => s + c.total_spent, 0) / result.length : 0;
    const topSpenders = result.filter((c) => c.segment === "VIP" || c.segment === "Top Spender").length;
    const churnRisk = result.filter((c) => c.segment === "Churn Risk").length;

    setStats({ avgCLV, topSpenders, churnRisk });
    setCustomers(result.slice(0, 100));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const segmentColor: Record<string, string> = {
    VIP: "bg-yellow-100 text-yellow-800",
    "Top Spender": "bg-green-100 text-green-800",
    Regular: "bg-blue-100 text-blue-800",
    "Churn Risk": "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Customer Lifetime Value</h1>
          <p className="text-sm text-muted-foreground">Segmentare automată și analiză CLV.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="w-6 h-6 mx-auto mb-1 text-blue-600" /><div className="text-2xl font-bold">{stats.avgCLV.toFixed(0)} RON</div><p className="text-xs text-muted-foreground">CLV Mediu</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Crown className="w-6 h-6 mx-auto mb-1 text-yellow-600" /><div className="text-2xl font-bold">{stats.topSpenders}</div><p className="text-xs text-muted-foreground">Top Spenders / VIP</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" /><div className="text-2xl font-bold">{stats.churnRisk}</div><p className="text-xs text-muted-foreground">Risc de Churn</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Cheltuit</TableHead>
                  <TableHead>Nr. Comenzi</TableHead>
                  <TableHead>AOV</TableHead>
                  <TableHead>Segment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.user_id}>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="font-medium">{c.total_spent.toFixed(0)} RON</TableCell>
                    <TableCell>{c.order_count}</TableCell>
                    <TableCell>{c.avg_order.toFixed(0)} RON</TableCell>
                    <TableCell><Badge variant="outline" className={segmentColor[c.segment] || ""}>{c.segment}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
