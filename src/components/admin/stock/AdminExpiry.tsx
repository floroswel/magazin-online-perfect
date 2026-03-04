import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle } from "lucide-react";

export default function AdminExpiry() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Clock className="w-5 h-5" /> Expirări</h1>
        <p className="text-sm text-muted-foreground">Produse cu dată de expirare — alerte și rapoarte.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-destructive/30"><CardContent className="p-4 text-center"><AlertTriangle className="w-5 h-5 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold text-destructive">0</p><p className="text-xs text-muted-foreground">Expirate</p></CardContent></Card>
        <Card className="border-yellow-500/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">0</p><p className="text-xs text-muted-foreground">Expiră în 30 zile</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Expiră în 90 zile</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Produs</TableHead><TableHead>Lot</TableHead><TableHead>Cantitate</TableHead><TableHead>Data expirare</TableHead><TableHead>Zile rămase</TableHead></TableRow></TableHeader>
            <TableBody><TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt produse cu dată de expirare.</TableCell></TableRow></TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
