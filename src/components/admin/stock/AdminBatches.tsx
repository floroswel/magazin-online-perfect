import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminBatches() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Layers className="w-5 h-5" /> Loturi</h1>
          <p className="text-sm text-muted-foreground">Gestionare pe loturi de producție și trasabilitate.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Lot nou</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Lot</TableHead>
                <TableHead>Produs</TableHead>
                <TableHead>Cantitate</TableHead>
                <TableHead>Data producție</TableHead>
                <TableHead>Expirare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt loturi înregistrate.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
