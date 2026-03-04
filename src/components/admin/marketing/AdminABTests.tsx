import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Plus } from "lucide-react";

export default function AdminABTests() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FlaskConical className="w-5 h-5" /> Teste A/B</h1>
          <p className="text-sm text-muted-foreground">Teste A/B pentru pagini, prețuri și promoții.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Test nou</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Teste active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Finalizate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">—</p><p className="text-xs text-muted-foreground">Cea mai bună îmbunătățire</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume test</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Trafic</TableHead>
                <TableHead>Varianta A</TableHead>
                <TableHead>Varianta B</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu există teste A/B configurate.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
