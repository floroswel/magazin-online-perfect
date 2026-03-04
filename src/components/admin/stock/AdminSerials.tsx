import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Barcode, Search } from "lucide-react";
import { useState } from "react";

export default function AdminSerials() {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Barcode className="w-5 h-5" /> Seriale / IMEI</h1>
        <p className="text-sm text-muted-foreground">Gestionare numere de serie și IMEI individuale pe produs.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută serial sau IMEI..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial / IMEI</TableHead>
                <TableHead>Produs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comandă</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nu sunt seriale înregistrate.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
