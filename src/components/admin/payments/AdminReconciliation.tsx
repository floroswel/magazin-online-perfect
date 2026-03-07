import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminReconciliation() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["reconciliation-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*, orders(id, total, order_number)")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const reconciled = transactions.filter((t: any) => t.reconciled);
  const mismatches = transactions.filter((t: any) => {
    const orderTotal = (t.orders as any)?.total;
    return orderTotal && Math.abs(t.amount - orderTotal) > 0.01 && !t.reconciled;
  });
  const missingOrder = transactions.filter((t: any) => !t.order_id || !(t.orders as any)?.id);
  const unreconciled = transactions.filter((t: any) => !t.reconciled && !mismatches.includes(t) && !missingOrder.includes(t));

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      // Auto-reconcile matching transactions
      const matching = transactions.filter((t: any) => {
        const orderTotal = (t.orders as any)?.total;
        return orderTotal && Math.abs(t.amount - orderTotal) <= 0.01 && !t.reconciled;
      });
      if (matching.length === 0) {
        toast({ title: "Totul este reconciliat", description: "Nu sunt tranzacții de reconciliat." });
        return;
      }
      const ids = matching.map((t: any) => t.id);
      const { error } = await supabase
        .from("payment_transactions")
        .update({ reconciled: true, reconciled_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      toast({ title: `${ids.length} tranzacții reconciliate` });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reconciliation-data"] }),
    onError: () => toast({ title: "Eroare la reconciliere", variant: "destructive" }),
  });

  const displayRows = [...mismatches, ...missingOrder, ...unreconciled, ...reconciled].slice(0, 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CheckCheck className="w-5 h-5" /> Reconciliere</h1>
          <p className="text-sm text-muted-foreground">Verificare plăți și status tranzacții — comparare bancă vs. sistem.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => reconcileMutation.mutate()} disabled={reconcileMutation.isPending}>
          <RefreshCw className={`w-4 h-4 mr-1 ${reconcileMutation.isPending ? "animate-spin" : ""}`} /> Rulează reconciliere
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{reconciled.length}</p><p className="text-xs text-muted-foreground">Reconciliate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{mismatches.length}</p><p className="text-xs text-muted-foreground">Nepotriviri</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{missingOrder.length}</p><p className="text-xs text-muted-foreground">Lipsă comandă</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{unreconciled.length}</p><p className="text-xs text-muted-foreground">Nereconciliate</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Comandă</TableHead><TableHead>Sumă tranzacție</TableHead><TableHead>Sumă comandă</TableHead><TableHead>Diferență</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt tranzacții.</TableCell></TableRow>
              ) : displayRows.map((t: any) => {
                const orderTotal = (t.orders as any)?.total || 0;
                const orderNum = (t.orders as any)?.order_number || "—";
                const diff = t.amount - orderTotal;
                const status = t.reconciled ? "ok" : Math.abs(diff) > 0.01 ? "mismatch" : !t.order_id ? "missing" : "pending";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">#{orderNum}</TableCell>
                    <TableCell className="text-sm">{t.amount?.toFixed(2)} RON</TableCell>
                    <TableCell className="text-sm">{orderTotal ? `${orderTotal.toFixed(2)} RON` : "—"}</TableCell>
                    <TableCell className={`text-sm ${Math.abs(diff) > 0.01 ? "text-destructive font-semibold" : ""}`}>
                      {Math.abs(diff) > 0.01 ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)} RON` : "✓"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "ok" ? "default" : status === "mismatch" ? "destructive" : "secondary"} className="text-[10px]">
                        {status === "ok" ? "Reconciliat" : status === "mismatch" ? "Nepotrivire" : status === "missing" ? "Fără comandă" : "Nereconciliat"}
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
