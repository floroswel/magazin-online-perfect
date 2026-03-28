import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Save, AlertTriangle } from "lucide-react";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id,name,price,old_price,stock,category_id,brand_id,visible,brands(name)").order("name").limit(500),
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

  const actionLabel: Record<string, string> = {
    price_increase: "Majorare preț %",
    price_decrease: "Reducere preț %",
    set_sale_price: "Setează preț promoțional %",
    remove_sale_price: "Elimină prețul promoțional",
    set_stock: "Setare stoc",
    set_category: "Schimbă categoria",
    activate: "Activează produsele",
    deactivate: "Dezactivează produsele",
  };

  const needsValue = !["remove_sale_price", "activate", "deactivate"].includes(action);

  const handleApplyClick = () => {
    if (selected.size === 0) return;
    if (needsValue && !actionValue) return;
    setConfirmOpen(true);
  };

  const applyBulk = async () => {
    setConfirmOpen(false);
    setApplying(true);
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
    } else if (action === "set_sale_price") {
      for (const id of ids) {
        const product = products.find((p) => p.id === id);
        if (product) {
          const salePrice = +(product.price * (1 - val / 100)).toFixed(2);
          await supabase.from("products").update({ old_price: product.price, price: salePrice }).eq("id", id);
        }
      }
    } else if (action === "remove_sale_price") {
      for (const id of ids) {
        const product = products.find((p) => p.id === id);
        if (product && product.old_price) {
          await supabase.from("products").update({ price: product.old_price, old_price: null }).eq("id", id);
        }
      }
    } else if (action === "set_stock") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ stock: val }).eq("id", id)));
    } else if (action === "set_category") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ category_id: actionValue }).eq("id", id)));
    } else if (action === "activate") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ visible: true }).eq("id", id)));
    } else if (action === "deactivate") {
      await Promise.all(ids.map((id) => supabase.from("products").update({ visible: false }).eq("id", id)));
    }

    toast({ title: `${ids.length} produse actualizate` });
    setSelected(new Set());
    setApplying(false);
    const { data } = await supabase.from("products").select("id,name,price,old_price,stock,category_id,brand_id,visible,brands(name)").order("name").limit(500);
    setProducts(data || []);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Actualizare în Masă</h1>
        <p className="text-sm text-muted-foreground">Modificare rapidă preț, stoc, categorie sau vizibilitate pentru mai multe produse.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">Acțiune</label>
              <Select value={action} onValueChange={(v) => { setAction(v); setActionValue(""); }}>
                <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsValue && (
              <div>
                <label className="text-xs font-medium mb-1 block">Valoare</label>
                {action === "set_category" ? (
                  <Select value={actionValue} onValueChange={setActionValue}>
                    <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Selectează" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input type="number" placeholder={action.includes("price") || action === "set_sale_price" ? "%" : "cantitate"} value={actionValue} onChange={(e) => setActionValue(e.target.value)} className="w-32 h-9" />
                )}
              </div>
            )}
            <Button onClick={handleApplyClick} disabled={selected.size === 0 || applying}>
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
                  <TableHead>Preț vechi</TableHead>
                  <TableHead>Stoc</TableHead>
                  <TableHead>Vizibil</TableHead>
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
                    <TableCell className="text-muted-foreground">{p.old_price ? `${p.old_price.toLocaleString("ro-RO")} lei` : "—"}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{p.visible !== false ? "✅" : "❌"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Confirmare acțiune
            </DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să aplici <strong>{actionLabel[action]}</strong>
              {needsValue && actionValue && <> cu valoarea <strong>{actionValue}{action.includes("price") || action === "set_sale_price" ? "%" : ""}</strong></>}
              {" "}pentru <strong>{selected.size} produse</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Renunță</Button>
            <Button onClick={applyBulk}>Da, aplică</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
