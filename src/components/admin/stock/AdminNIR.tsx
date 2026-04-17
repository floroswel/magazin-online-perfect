import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileInput, Plus } from "lucide-react";

export default function AdminNIR() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FileInput className="w-5 h-5" /> NIR (Recepție Marfă)</h1>
          <p className="text-sm text-muted-foreground">Recepție marfă cu generare Notă de Intrare Recepție.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> NIR nou</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">NIR-uri luna aceasta</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Produse recepționate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0 RON</p><p className="text-xs text-muted-foreground">Valoare recepții</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. NIR</TableHead>
                <TableHead>Furnizor</TableHead>
                <TableHead>Depozit</TableHead>
                <TableHead>Produse</TableHead>
                <TableHead>Valoare</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu există NIR-uri.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
