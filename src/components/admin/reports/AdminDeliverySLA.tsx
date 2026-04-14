import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export default function AdminDeliverySLA() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ onTime: 0, delayed: 0, avgDays: 0 });

  const SLA_DAYS = 3; // promised SLA

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at, delivered_at, shipping_method, user_email")
      .in("status", ["shipping", "delivered", "livrat"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (!data) { setLoading(false); return; }

    let onTime = 0, delayed = 0, totalDays = 0, deliveredCount = 0;
    const enriched = data.map((o) => {
      const created = new Date(o.created_at).getTime();
      const delivered = o.delivered_at ? new Date(o.delivered_at).getTime() : null;
      const daysToDeliver = delivered ? (delivered - created) / 86400000 : null;
      const isDelivered = !!delivered;
      const isOnTime = daysToDeliver !== null ? daysToDeliver <= SLA_DAYS : null;
      const isOverdue = !isDelivered && (Date.now() - created) / 86400000 > SLA_DAYS;

      if (isDelivered && daysToDeliver !== null) {
        totalDays += daysToDeliver;
        deliveredCount++;
        if (isOnTime) onTime++; else delayed++;
      }
      if (isOverdue) delayed++;

      return { ...o, daysToDeliver, isOnTime, isOverdue };
    });

    setStats({
      onTime,
      delayed,
      avgDays: deliveredCount > 0 ? totalDays / deliveredCount : 0,
    });
    setOrders(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5" /> SLA Livrare</h1>
          <p className="text-sm text-muted-foreground">Monitorizare timpi livrare vs SLA promis ({SLA_DAYS} zile).</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" /><div className="text-2xl font-bold">{stats.onTime}</div><p className="text-xs text-muted-foreground">La timp</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" /><div className="text-2xl font-bold">{stats.delayed}</div><p className="text-xs text-muted-foreground">Întârziate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-6 h-6 mx-auto mb-1 text-blue-600" /><div className="text-2xl font-bold">{stats.avgDays.toFixed(1)} zile</div><p className="text-xs text-muted-foreground">Timp mediu livrare</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zile Livrare</TableHead>
                  <TableHead>SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 50).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.order_number || o.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{o.user_email || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell>{o.daysToDeliver !== null ? `${o.daysToDeliver.toFixed(1)}` : o.isOverdue ? "Depășit" : "În curs"}</TableCell>
                    <TableCell>
                      {o.isOnTime === true && <Badge className="bg-green-100 text-green-800">OK</Badge>}
                      {o.isOnTime === false && <Badge className="bg-red-100 text-red-800">Întârziat</Badge>}
                      {o.isOverdue && <Badge className="bg-orange-100 text-orange-800">Depășit SLA</Badge>}
                      {o.isOnTime === null && !o.isOverdue && <Badge variant="outline">—</Badge>}
                    </TableCell>
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
