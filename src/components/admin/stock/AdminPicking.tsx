import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Printer } from "lucide-react";

export default function AdminPicking() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-picking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, status, created_at")
        .eq("status", "processing").order("created_at").limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> Picking List</h1>
          <p className="text-sm text-muted-foreground">Generare liste de picking pentru comenzile în procesare.</p>
        </div>
        <Button size="sm" disabled={orders.length === 0}><Printer className="w-4 h-4 mr-1" /> Generează picking list</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comandă</TableHead>
                <TableHead>Produse</TableHead>
                <TableHead>Status picking</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nu sunt comenzi de procesat.</TableCell></TableRow>
              ) : orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">Nepreluat</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm">Start picking</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
