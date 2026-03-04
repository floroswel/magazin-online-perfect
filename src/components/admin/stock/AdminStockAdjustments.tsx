import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings2, Plus } from "lucide-react";
import { format } from "date-fns";

export default function AdminStockAdjustments() {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-adjustments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_movements").select("*")
        .in("type", ["adjustment_in", "adjustment_out", "correction"])
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Settings2 className="w-5 h-5" /> Ajustări Stoc</h1>
          <p className="text-sm text-muted-foreground">Intrări și ieșiri manuale de stoc cu motiv.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajustare nouă</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Cantitate</TableHead>
                <TableHead>Motiv</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : movements.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu există ajustări.</TableCell></TableRow>
              ) : movements.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.product_id?.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant={m.quantity > 0 ? "default" : "destructive"} className="text-[10px]">{m.quantity > 0 ? "Intrare" : "Ieșire"}</Badge></TableCell>
                  <TableCell className="font-semibold">{m.quantity > 0 ? "+" : ""}{m.quantity}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{m.reference || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(m.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
