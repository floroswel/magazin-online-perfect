import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { translateOrderStatus } from "@/lib/orderStatusLabels";

export default function AdminIssueOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["issue-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*")
        .in("status", ["payment_failed", "stock_issue", "cancelled"])
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Comenzi cu Probleme</h1>
        <p className="text-sm text-muted-foreground">Plată eșuată, stoc insuficient sau alte probleme.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Problemă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">🎉 Nicio comandă cu probleme!</TableCell></TableRow>
              ) : orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="destructive">{o.status === "payment_failed" ? "Plată eșuată" : o.status === "stock_issue" ? "Stoc insuficient" : "Anulată"}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                  <TableCell className="font-semibold">{o.total} RON</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd.MM.yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
