import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Clock, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminPredictiveStock() {
  const { data: products = [] } = useQuery({
    queryKey: ["pred-stock-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, stock, price, image_url, sku")
        .gt("stock", 0)
        .order("stock", { ascending: true })
        .limit(200);
      return data || [];
    },
  });

  // Get last 90 days of sales data
  const { data: salesData = [] } = useQuery({
    queryKey: ["pred-stock-sales"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const { data } = await supabase
        .from("order_items")
        .select("product_id, quantity, created_at")
        .gte("created_at", cutoff.toISOString());
      return data || [];
    },
  });

  const predictions = useMemo(() => {
    // Calculate daily sales velocity per product
    const salesByProduct: Record<string, { totalQty: number; firstSale: string; lastSale: string }> = {};

    salesData.forEach((item: any) => {
      const pid = item.product_id;
      if (!salesByProduct[pid]) {
        salesByProduct[pid] = { totalQty: 0, firstSale: item.created_at, lastSale: item.created_at };
      }
      salesByProduct[pid].totalQty += item.quantity;
      if (item.created_at < salesByProduct[pid].firstSale) salesByProduct[pid].firstSale = item.created_at;
      if (item.created_at > salesByProduct[pid].lastSale) salesByProduct[pid].lastSale = item.created_at;
    });

    return products
      .map((p: any) => {
        const sales = salesByProduct[p.id];
        if (!sales || sales.totalQty === 0) {
          return { ...p, dailyRate: 0, daysLeft: Infinity, stockoutDate: null, urgency: "safe" };
        }

        const daySpan = Math.max(1, Math.ceil(
          (new Date(sales.lastSale).getTime() - new Date(sales.firstSale).getTime()) / 86400000
        ));
        const dailyRate = sales.totalQty / daySpan;
        const daysLeft = dailyRate > 0 ? Math.round(p.stock / dailyRate) : Infinity;
        const stockoutDate = daysLeft < Infinity
          ? new Date(Date.now() + daysLeft * 86400000).toISOString().slice(0, 10)
          : null;

        let urgency = "safe";
        if (daysLeft <= 7) urgency = "critical";
        else if (daysLeft <= 14) urgency = "warning";
        else if (daysLeft <= 30) urgency = "attention";

        return { ...p, dailyRate: Math.round(dailyRate * 100) / 100, daysLeft, stockoutDate, urgency };
      })
      .filter((p: any) => p.dailyRate > 0)
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft);
  }, [products, salesData]);

  const critical = predictions.filter((p: any) => p.urgency === "critical").length;
  const warning = predictions.filter((p: any) => p.urgency === "warning").length;

  const urgencyColors: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    warning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    attention: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    safe: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  };

  const urgencyLabels: Record<string, string> = {
    critical: "Critic",
    warning: "Atenție",
    attention: "De urmărit",
    safe: "OK",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critice (&lt;7 zile)</p>
              <p className="text-2xl font-bold text-destructive">{critical}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atenție (&lt;14 zile)</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warning}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Produse monitorizate</p>
              <p className="text-2xl font-bold text-foreground">{predictions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" /> Predicție Stoc — Bazat pe ritm vânzări (90 zile)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nu sunt suficiente date de vânzări pentru predicții.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead className="text-center">Stoc actual</TableHead>
                    <TableHead className="text-center">Vânzări/zi</TableHead>
                    <TableHead className="text-center">Zile rămase</TableHead>
                    <TableHead className="text-center">Data estimată epuizare</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.slice(0, 50).map((p: any) => (
                    <TableRow key={p.id} className={p.urgency === "critical" ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.image_url && (
                            <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
                            {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{p.stock}</TableCell>
                      <TableCell className="text-center font-mono">{p.dailyRate}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-sm">{p.daysLeft} zile</span>
                          <Progress
                            value={Math.min(100, (p.daysLeft / 30) * 100)}
                            className="h-1.5 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {p.stockoutDate || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={urgencyColors[p.urgency]}>
                          {urgencyLabels[p.urgency]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
