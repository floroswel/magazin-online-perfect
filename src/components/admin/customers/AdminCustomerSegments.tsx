import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Clock, ShoppingBag, AlertTriangle, Sparkles } from "lucide-react";

interface Segment {
  label: string;
  description: string;
  icon: any;
  color: string;
  badgeColor: string;
  count: number;
  percentage: number;
  insight: string;
}

export default function AdminCustomerSegments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total, created_at, status");

      if (!orders) { setLoading(false); return; }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Per-user stats
      const userStats = new Map<string, { count: number; total: number; lastOrder: Date; firstOrder: Date }>();
      orders.forEach((o) => {
        const d = new Date(o.created_at);
        const s = userStats.get(o.user_id) || { count: 0, total: 0, lastOrder: d, firstOrder: d };
        s.count++;
        s.total += Number(o.total);
        if (d > s.lastOrder) s.lastOrder = d;
        if (d < s.firstOrder) s.firstOrder = d;
        userStats.set(o.user_id, s);
      });

      const users = Array.from(userStats.entries());
      const total = users.length;
      setTotalUsers(total);

      const recentBuyers = users.filter(([, s]) => s.lastOrder >= thirtyDaysAgo);
      const atRisk = users.filter(([, s]) => s.lastOrder < thirtyDaysAgo && s.lastOrder >= ninetyDaysAgo && s.count >= 2);
      const churned = users.filter(([, s]) => s.lastOrder < ninetyDaysAgo);
      const highValue = users.filter(([, s]) => s.total >= 3000);
      const newCustomers = users.filter(([, s]) => s.count === 1 && s.firstOrder >= thirtyDaysAgo);
      const champions = users.filter(([, s]) => s.count >= 5 && s.total >= 2000 && s.lastOrder >= ninetyDaysAgo);

      const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;

      setSegments([
        {
          label: "Campioni",
          description: "≥5 comenzi, ≥2.000 lei, activi în ultimele 90 zile",
          icon: Sparkles,
          color: "text-yellow-400",
          badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          count: champions.length,
          percentage: pct(champions.length),
          insight: "Programul de fidelitate îi menține activi — oferă acces early-access.",
        },
        {
          label: "Cumpărători recenți",
          description: "Au cumpărat în ultimele 30 de zile",
          icon: ShoppingBag,
          color: "text-green-400",
          badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
          count: recentBuyers.length,
          percentage: pct(recentBuyers.length),
          insight: "Trimite email de mulțumire + recomandări personalizate.",
        },
        {
          label: "Clienți noi",
          description: "Prima comandă în ultimele 30 zile",
          icon: TrendingUp,
          color: "text-primary",
          badgeColor: "bg-primary/20 text-primary border-primary/30",
          count: newCustomers.length,
          percentage: pct(newCustomers.length),
          insight: "Welcome series + cupon 10% la a doua comandă crește retenția.",
        },
        {
          label: "La risc",
          description: "Activi între 30–90 zile, ≥2 comenzi istorice",
          icon: AlertTriangle,
          color: "text-orange-400",
          badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          count: atRisk.length,
          percentage: pct(atRisk.length),
          insight: "Campanii win-back cu oferte personalizate.",
        },
        {
          label: "Pierduți",
          description: "Fără activitate >90 zile",
          icon: Clock,
          color: "text-red-400",
          badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
          count: churned.length,
          percentage: pct(churned.length),
          insight: "Re-engagement agresiv: Ne-ai lipsit! + reducere 20%.",
        },
        {
          label: "Valoare ridicată",
          description: "Total cheltuieli ≥3.000 lei",
          icon: Target,
          color: "text-blue-400",
          badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          count: highValue.length,
          percentage: pct(highValue.length),
          insight: "Acces prioritar la produse noi, livrare gratuită permanentă.",
        },
      ]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Se încarcă segmentele...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Segmentare Clienți</h1>
        <p className="text-sm text-muted-foreground">
          Segmente automate bazate pe comportament — {totalUsers} clienți analizați
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((seg) => {
          const Icon = seg.icon;
          return (
            <Card key={seg.label} className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${seg.color}`} />
                    <Badge className={seg.badgeColor}>{seg.label}</Badge>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{seg.count}</span>
                </div>

                <p className="text-xs text-muted-foreground">{seg.description}</p>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{seg.percentage}% din total</span>
                    <span className="text-muted-foreground">{seg.count}/{totalUsers}</span>
                  </div>
                  <Progress value={seg.percentage} className="h-2" />
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Recomandare:</span>{" "}{seg.insight}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
