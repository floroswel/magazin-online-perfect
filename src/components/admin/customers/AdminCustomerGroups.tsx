import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, UserCheck, Eye } from "lucide-react";

interface CustomerGroup {
  label: string;
  description: string;
  icon: any;
  color: string;
  count: number;
  revenue: number;
  avgOrder: number;
}

export default function AdminCustomerGroups() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total");

      if (!orders) { setLoading(false); return; }

      // Aggregate per user
      const userStats = new Map<string, { count: number; total: number }>();
      orders.forEach((o) => {
        const s = userStats.get(o.user_id) || { count: 0, total: 0 };
        s.count++;
        s.total += Number(o.total);
        userStats.set(o.user_id, s);
      });

      const users = Array.from(userStats.values());

      const vip = users.filter((u) => u.total >= 5000);
      const b2b = users.filter((u) => u.total >= 2000 && u.total < 5000);
      const regular = users.filter((u) => u.count >= 2 && u.total < 2000);
      const oneTime = users.filter((u) => u.count === 1 && u.total < 2000);

      const calcGroup = (arr: typeof users, label: string, desc: string, icon: any, color: string): CustomerGroup => ({
        label,
        description: desc,
        icon,
        color,
        count: arr.length,
        revenue: arr.reduce((s, u) => s + u.total, 0),
        avgOrder: arr.length ? arr.reduce((s, u) => s + u.total, 0) / arr.reduce((s, u) => s + u.count, 0) : 0,
      });

      setGroups([
        calcGroup(vip, "VIP", "Clienți cu cheltuieli ≥ 5.000 lei", Crown, "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"),
        calcGroup(b2b, "Business", "Cheltuieli 2.000–5.000 lei — potențial B2B", Users, "bg-blue-500/20 text-blue-400 border-blue-500/30"),
        calcGroup(regular, "Fideli", "≥2 comenzi, sub 2.000 lei total", UserCheck, "bg-green-500/20 text-green-400 border-green-500/30"),
        calcGroup(oneTime, "Ocazionali", "O singură comandă", Eye, "bg-muted text-muted-foreground border-border"),
      ]);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalCustomers = groups.reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupuri Clienți</h1>
        <p className="text-sm text-muted-foreground">Segmentare automată pe baza comportamentului de achiziție</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <Card key={g.label} className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${g.color.split(" ")[0]}`}>
                    <Icon className={`w-5 h-5 ${g.color.split(" ")[1]}`} />
                  </div>
                  <Badge className={g.color}>{g.label}</Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">{g.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span>Venituri: {g.revenue.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} lei</span>
                  <span>Media: {g.avgOrder.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} lei</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Grup</TableHead>
                  <TableHead className="text-right">Clienți</TableHead>
                  <TableHead className="text-right">% din total</TableHead>
                  <TableHead className="text-right">Venituri totale</TableHead>
                  <TableHead className="text-right">Valoare medie comandă</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.label} className="border-border">
                    <TableCell><Badge className={g.color}>{g.label}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{g.count}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {totalCustomers ? ((g.count / totalCustomers) * 100).toFixed(1) : 0}%
                    </TableCell>
                    <TableCell className="text-right font-mono">{g.revenue.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</TableCell>
                    <TableCell className="text-right font-mono">{g.avgOrder.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</TableCell>
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
