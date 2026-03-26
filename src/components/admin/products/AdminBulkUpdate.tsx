import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pencil, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminBulkUpdate() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState("price_increase");
  const [actionValue, setActionValue] = useState("");

  useEffect(() => {
    Promise.all([
      (supabase as any).from("products").select("id,name,price,stock,category_id,brand_id,brands(name)").order("name").limit(500),
      supabase.from("categories").select("id,name"),
    ]).then(([p, c]) => {
      setProducts(p.data || []);
      setCategories(c.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const applyBulk = async () => {
    if (selected.size === 0 || !actionValue) return;
    const ids = Array.from(selected);
    const val = parseFloat(actionValue);

    if (action === "price_increase") {
      for (const id of ids) {
        const product = products.find((p) => p.id === id);
        if (product) await supabase.from("products").update({ price: +(product.price * (1 + val / 100)).toFixed(2) }).eq("id", id);
      }
    } else if (action === "price_decrease") {
      for (const id of ids) {
        const product = products.find((p) => p.id === id);
        if (product) await supabase.from("products").update({ price: +(product.price * (1 - val / 100)).toFixed(2) }).eq("id", id);
      }
    } else if (action === "set_stock") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ stock: val }).eq("id", id)));
    } else if (action === "set_category") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ category_id: actionValue }).eq("id", id)));
    }

    toast({ title: `${ids.length} produse actualizate` });
    setSelected(new Set());
    const { data } = await (supabase as any).from("products").select("id,name,price,stock,category_id,brand_id,brands(name)").order("name").limit(500);
    setProducts(data || []);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Actualizare în Masă</h1>
        <p className="text-sm text-muted-foreground">Modificare rapidă preț, stoc sau categorie pentru mai multe produse.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">Acțiune</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_increase">Majorare preț %</SelectItem>
                  <SelectItem value="price_decrease">Reducere preț %</SelectItem>
                  <SelectItem value="set_stock">Setare stoc</SelectItem>
                  <SelectItem value="set_category">Schimbă categoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Valoare</label>
              {action === "set_category" ? (
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Selectează" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input type="number" placeholder={action.includes("price") ? "%" : "cantitate"} value={actionValue} onChange={(e) => setActionValue(e.target.value)} className="w-32 h-9" />
              )}
            </div>
            <Button onClick={applyBulk} disabled={selected.size === 0}>
              <Save className="w-4 h-4 mr-1" /> Aplică ({selected.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{selected.size} / {filtered.length} selectate</CardTitle>
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
                  <TableHead className="w-8"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Stoc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={(c) => {
                        const next = new Set(selected);
                        c ? next.add(p.id) : next.delete(p.id);
                        setSelected(next);
                      }} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell>{p.price?.toLocaleString("ro-RO")} lei</TableCell>
                    <TableCell>{p.stock}</TableCell>
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
