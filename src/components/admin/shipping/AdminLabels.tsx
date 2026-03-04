import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, Printer } from "lucide-react";

export default function AdminLabels() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Tag className="w-5 h-5" /> Etichete Expediere</h1>
          <p className="text-sm text-muted-foreground">Generare și printare etichete de expediere în masă.</p>
        </div>
        <Button size="sm"><Printer className="w-4 h-4 mr-1" /> Printează selecția</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>AWB</TableHead><TableHead>Curier</TableHead><TableHead>Comandă</TableHead><TableHead>Destinatar</TableHead><TableHead>Acțiuni</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt etichete de printat. Generează AWB-uri mai întâi.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
