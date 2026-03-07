import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ro } from "date-fns/locale";

export default function AdminSettlements() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["settlement-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*, payment_methods(name)")
        .in("status", ["completed", "settled", "pending"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonth = transactions.filter(
    (t: any) => t.status === "settled" && new Date(t.created_at) >= thisMonthStart && new Date(t.created_at) <= thisMonthEnd
  );
  const pending = transactions.filter((t: any) => t.status === "completed" && !t.reconciled);
  const settledTotal = thisMonth.reduce((s: number, t: any) => s + (t.amount - (t.refunded_amount || 0)), 0);
  const pendingTotal = pending.reduce((s: number, t: any) => s + t.amount, 0);

  // Group by month for settlement periods
  const periods = new Map<string, { transactions: any[]; total: number; refunds: number; processor: string }>();
  transactions.forEach((t: any) => {
    const month = format(new Date(t.created_at), "yyyy-MM");
    const proc = (t.payment_methods as any)?.name || "Necunoscut";
    const key = `${month}-${proc}`;
    if (!periods.has(key)) periods.set(key, { transactions: [], total: 0, refunds: 0, processor: proc });
    const p = periods.get(key)!;
    p.transactions.push(t);
    p.total += t.amount;
    p.refunds += t.refunded_amount || 0;
  });

  const periodRows = Array.from(periods.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Banknote className="w-5 h-5" /> Decontări</h1>
        <p className="text-sm text-muted-foreground">Perioade de decontare și reconciliere cu procesatorii de plăți.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{settledTotal.toFixed(2)} RON</p><p className="text-xs text-muted-foreground">Decontat luna aceasta</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{pendingTotal.toFixed(2)} RON</p><p className="text-xs text-muted-foreground">În așteptare</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">Tranzacții nedecontate</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perioadă</TableHead>
                <TableHead>Procesor</TableHead>
                <TableHead>Tranzacții</TableHead>
                <TableHead>Total brut</TableHead>
                <TableHead>Refunduri</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodRows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu există tranzacții.</TableCell></TableRow>
              ) : periodRows.map(([key, p]) => {
                const allSettled = p.transactions.every((t: any) => t.reconciled);
                const net = p.total - p.refunds;
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium text-sm">{key.split("-").slice(0, 2).join("-")}</TableCell>
                    <TableCell className="text-sm">{p.processor}</TableCell>
                    <TableCell>{p.transactions.length}</TableCell>
                    <TableCell className="text-sm">{p.total.toFixed(2)} RON</TableCell>
                    <TableCell className="text-sm text-destructive">{p.refunds > 0 ? `-${p.refunds.toFixed(2)}` : "0"} RON</TableCell>
                    <TableCell className="font-semibold text-sm">{net.toFixed(2)} RON</TableCell>
                    <TableCell>
                      <Badge variant={allSettled ? "default" : "secondary"} className="text-[10px]">
                        {allSettled ? "Decontat" : "Parțial"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
