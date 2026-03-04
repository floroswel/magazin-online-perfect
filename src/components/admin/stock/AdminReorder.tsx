import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, RefreshCw } from "lucide-react";

export default function AdminReorder() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["reorder-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_alerts").select("*, products(name, brand)")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Aprovizionare</h1>
          <p className="text-sm text-muted-foreground">Sugestii automate de reaprovizionare bazate pe alerte de stoc.</p>
        </div>
        <Button size="sm" variant="outline"><RefreshCw className="w-4 h-4 mr-1" /> Recalculează</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>Stoc curent</TableHead>
                <TableHead>Prag alertă</TableHead>
                <TableHead>Sugestie comandă</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Stocul este OK — nicio sugestie de reaprovizionare.</TableCell></TableRow>
              ) : alerts.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{(a.products as any)?.name || "—"}</TableCell>
                  <TableCell><Badge variant="destructive" className="text-[10px]">Sub prag</Badge></TableCell>
                  <TableCell>{a.threshold}</TableCell>
                  <TableCell className="font-semibold">{(a.threshold || 10) * 3} buc</TableCell>
                  <TableCell><Button variant="ghost" size="sm">Comandă furnizor</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
