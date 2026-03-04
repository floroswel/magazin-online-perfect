import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeftRight, Plus } from "lucide-react";

export default function AdminStockTransfers() {
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /> Transferuri Stoc</h1>
          <p className="text-sm text-muted-foreground">Transfer produse între depozite. {warehouses.length} depozite disponibile.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Transfer nou</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transfer</TableHead>
                <TableHead>Din depozit</TableHead>
                <TableHead>În depozit</TableHead>
                <TableHead>Produse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu au fost efectuate transferuri.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
