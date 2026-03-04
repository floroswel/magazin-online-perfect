import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminProductSEO() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("products").select("id,name,slug,meta_title,meta_description,description").order("name").limit(500)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  const getSeoScore = (p: any) => {
    let score = 0;
    if (p.meta_title && p.meta_title.length > 10 && p.meta_title.length < 60) score++;
    if (p.meta_description && p.meta_description.length > 50 && p.meta_description.length < 160) score++;
    if (p.slug && p.slug.length > 3) score++;
    if (p.description && p.description.length > 100) score++;
    return score;
  };

  const filtered = products
    .filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getSeoScore(a) - getSeoScore(b));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">SEO Produse</h1>
        <p className="text-sm text-muted-foreground">Scor SEO per produs — optimizare meta titluri, descrieri și slug-uri.</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} produse</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead>Meta Desc</TableHead>
                  <TableHead>Scor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((p) => {
                  const score = getSeoScore(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell>
                        {p.meta_title ? (
                          <span className="text-xs">{p.meta_title.slice(0, 40)}…</span>
                        ) : (
                          <Badge variant="outline" className="text-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />Lipsă</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.meta_description ? (
                          <span className="text-xs">{p.meta_description.slice(0, 40)}…</span>
                        ) : (
                          <Badge variant="outline" className="text-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />Lipsă</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {score >= 3 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-orange-500" />}
                          <span className="text-sm font-medium">{score}/4</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
