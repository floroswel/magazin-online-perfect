import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote } from "lucide-react";

export default function AdminSettlements() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Banknote className="w-5 h-5" /> Decontări</h1>
        <p className="text-sm text-muted-foreground">Perioade de decontare și reconciliere cu procesatorii de plăți.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0 RON</p><p className="text-xs text-muted-foreground">Decontat luna aceasta</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0 RON</p><p className="text-xs text-muted-foreground">În așteptare</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Tranzacții nedecontate</p></CardContent></Card>
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
                <TableHead>Comisioane</TableHead>
                <TableHead>Net primit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu există decontări.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
