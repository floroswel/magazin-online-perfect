import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ArrowUpRight, RotateCcw } from "lucide-react";

export default function AdminRefunds() {
  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ["payment-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*, payment_methods(name), orders(order_number, user_email)")
        .or("status.eq.refunded,status.eq.partially_refunded")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const totalRefunded = refunds.reduce((s: number, t: any) => s + Number(t.refunded_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Refund-uri</h1>
        <p className="text-sm text-muted-foreground">Rambursări parțiale și totale.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total rambursat</p>
            <p className="text-lg font-bold text-foreground">{totalRefunded.toLocaleString("ro-RO")} RON</p>
          </div>
          <Badge variant="secondary" className="ml-auto">{refunds.length} rambursări</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>
          ) : refunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RotateCcw className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nu sunt rambursări înregistrate.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Metodă</TableHead>
                  <TableHead className="text-right">Sumă originală</TableHead>
                  <TableHead className="text-right">Rambursat</TableHead>
                  <TableHead>Tip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {t.updated_at ? format(new Date(t.updated_at), "dd MMM yyyy, HH:mm", { locale: ro }) : "-"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{t.orders?.order_number || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.orders?.user_email || "-"}</TableCell>
                    <TableCell className="text-sm">{t.payment_methods?.name || "-"}</TableCell>
                    <TableCell className="text-right text-sm">{Number(t.amount).toLocaleString("ro-RO")} {t.currency}</TableCell>
                    <TableCell className="text-right font-semibold text-sm text-orange-600">
                      -{Number(t.refunded_amount || 0).toLocaleString("ro-RO")} {t.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "refunded" ? "destructive" : "secondary"} className="text-[10px]">
                        {t.status === "refunded" ? "Total" : "Parțial"}
                      </Badge>
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
