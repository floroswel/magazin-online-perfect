import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminReconciliation() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CheckCheck className="w-5 h-5" /> Reconciliere</h1>
          <p className="text-sm text-muted-foreground">Verificare plăți și status tranzacții — comparare bancă vs. sistem.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast({ title: "Se rulează reconcilierea..." })}>
          <RefreshCw className="w-4 h-4 mr-1" /> Rulează reconciliere
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">0</p><p className="text-xs text-muted-foreground">Reconciliate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">0</p><p className="text-xs text-muted-foreground">Nepotriviri</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">0</p><p className="text-xs text-muted-foreground">Lipsă bancă</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Lipsă sistem</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Comandă</TableHead><TableHead>Sumă sistem</TableHead><TableHead>Sumă bancă</TableHead><TableHead>Diferență</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Rulează reconcilierea pentru a vedea rezultatele.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
