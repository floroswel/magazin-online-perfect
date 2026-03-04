import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function AdminSuppliers() {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Factory className="w-5 h-5" /> Furnizori</h1>
          <p className="text-sm text-muted-foreground">Gestionare furnizori, prețuri de achiziție, comenzi de aprovizionare.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Furnizor nou</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută furnizor..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume furnizor</TableHead>
                <TableHead>CUI</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Produse furnizate</TableHead>
                <TableHead>Termen livrare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt furnizori adăugați.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
