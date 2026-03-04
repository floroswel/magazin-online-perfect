import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Puzzle, Search, Plus } from "lucide-react";
import { useState } from "react";

export default function AdminCompatibility() {
  const [search, setSearch] = useState("");
  const { data: products = [] } = useQuery({
    queryKey: ["products-compat"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, brand").order("name").limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = products.filter((p: any) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Puzzle className="w-5 h-5" /> Compatibilități</h1>
          <p className="text-sm text-muted-foreground">Produse compatibile (ex: toner pentru imprimantă X).</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Regulă nouă</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută produs..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Compatibil cu</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nu sunt produse.</TableCell></TableRow>
              ) : filtered.slice(0, 20).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.brand || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">0 compatibilități</TableCell>
                  <TableCell><Button variant="ghost" size="sm">Editează</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
