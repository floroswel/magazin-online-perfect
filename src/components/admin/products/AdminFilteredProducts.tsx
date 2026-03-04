import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Search, ImageOff, FileX, Tag, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FilterType = "promo" | "no-image" | "no-description" | "all";

interface Props {
  filter: FilterType;
  title: string;
  description: string;
}

export default function AdminFilteredProducts({ filter, title, description }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(200);

      if (filter === "promo") {
        query = query.not("old_price", "is", null).gt("old_price", 0);
      }

      const { data } = await query;
      let results = data || [];

      if (filter === "no-image") {
        results = results.filter((p) => !p.images || (Array.isArray(p.images) && p.images.length === 0));
      }
      if (filter === "no-description") {
        results = results.filter((p) => !p.description || (typeof p.description === "string" && p.description.trim().length < 20));
      }

      setProducts(results);
      setLoading(false);
    };
    fetchProducts();
  }, [filter]);

  const filtered = products.filter(
    (p) => !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const icon = filter === "no-image" ? <ImageOff className="w-12 h-12 mx-auto mb-3 opacity-40" /> : filter === "no-description" ? <FileX className="w-12 h-12 mx-auto mb-3 opacity-40" /> : <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {icon}
              <p>Nu sunt produse care corespund filtrului</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Stoc</TableHead>
                  {filter === "promo" && <TableHead>Discount</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} className="w-8 h-8 rounded object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><ImageOff className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{p.price?.toLocaleString("ro-RO")} lei</TableCell>
                    <TableCell>
                      <Badge variant={p.stock > 0 ? "outline" : "destructive"}>{p.stock}</Badge>
                    </TableCell>
                    {filter === "promo" && (
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">
                          -{Math.round(((p.old_price - p.price) / p.old_price) * 100)}%
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
