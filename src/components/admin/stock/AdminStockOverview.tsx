import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Search, AlertTriangle, Package } from "lucide-react";

interface StockRow {
  id: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number | null;
  product: { id: string; name: string; image_url: string | null; stock: number };
  warehouse: { id: string; name: string };
}

export default function AdminStockOverview() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const [{ data: stockData }, { data: whData }] = await Promise.all([
        supabase.from("warehouse_stock").select("id, quantity, min_quantity, max_quantity, product:products(id, name, image_url, stock), warehouse:warehouses(id, name)"),
        supabase.from("warehouses").select("id, name").order("name"),
      ]);
      if (stockData) setStocks(stockData as any);
      if (whData) setWarehouses(whData);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = stocks.filter((s) => {
    const matchSearch = s.product?.name?.toLowerCase().includes(search.toLowerCase());
    const matchWh = warehouseFilter === "all" || s.warehouse?.id === warehouseFilter;
    return matchSearch && matchWh;
  });

  const lowStockCount = stocks.filter((s) => s.quantity <= s.min_quantity && s.quantity > 0).length;
  const outOfStockCount = stocks.filter((s) => s.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stocuri</h1>
          <p className="text-sm text-muted-foreground">Vizualizare stocuri pe depozite și produse</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stocks.length}</p>
              <p className="text-sm text-muted-foreground">Înregistrări stoc</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
              <p className="text-sm text-muted-foreground">Stoc scăzut</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{outOfStockCount}</p>
              <p className="text-sm text-muted-foreground">Fără stoc</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută produs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Depozit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate depozitele</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nu există înregistrări de stoc.</p>
              <p className="text-sm text-muted-foreground">Adaugă produse în depozite din „Mișcări stoc".</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Produs</TableHead>
                  <TableHead>Depozit</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead className="text-right">Minim</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const status = s.quantity === 0 ? "out" : s.quantity <= s.min_quantity ? "low" : "ok";
                  return (
                    <TableRow key={s.id} className="border-border">
                      <TableCell className="font-medium">{s.product?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.warehouse?.name || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{s.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{s.min_quantity}</TableCell>
                      <TableCell>
                        {status === "out" && <Badge variant="destructive">Fără stoc</Badge>}
                        {status === "low" && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Stoc scăzut</Badge>}
                        {status === "ok" && <Badge className="bg-primary/20 text-primary border-primary/30">OK</Badge>}
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
