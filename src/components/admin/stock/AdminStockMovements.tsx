import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface Movement {
  id: string;
  movement_type: string;
  quantity: number;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  product: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
}

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  in: { label: "Intrare", icon: ArrowDownLeft, color: "text-green-400" },
  out: { label: "Ieșire", icon: ArrowUpRight, color: "text-red-400" },
  transfer: { label: "Transfer", icon: ArrowLeftRight, color: "text-blue-400" },
  adjustment: { label: "Ajustare", icon: Settings2, color: "text-yellow-400" },
  return: { label: "Retur", icon: RotateCcw, color: "text-purple-400" },
};

export default function AdminStockMovements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", warehouse_id: "", movement_type: "in", quantity: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [{ data: mvData }, { data: pData }, { data: wData }] = await Promise.all([
      supabase.from("stock_movements").select("id, movement_type, quantity, notes, reference_type, reference_id, created_at, product:products(id, name), warehouse:warehouses(id, name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("id, name").order("name"),
      supabase.from("warehouses").select("id, name").order("name"),
    ]);
    if (mvData) setMovements(mvData as any);
    if (pData) setProducts(pData);
    if (wData) setWarehouses(wData);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async () => {
    if (!form.product_id || !form.warehouse_id || !form.quantity) {
      toast.error("Completează toate câmpurile obligatorii");
      return;
    }
    setSubmitting(true);

    const qty = parseInt(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Cantitatea trebuie să fie un număr pozitiv");
      setSubmitting(false);
      return;
    }

    // Insert movement
    const { error: mvErr } = await supabase.from("stock_movements").insert({
      product_id: form.product_id,
      warehouse_id: form.warehouse_id,
      movement_type: form.movement_type,
      quantity: qty,
      notes: form.notes || null,
      created_by: user!.id,
    });

    if (mvErr) { toast.error("Eroare la înregistrare"); setSubmitting(false); return; }

    // Update warehouse_stock
    const { data: existing } = await supabase.from("warehouse_stock")
      .select("id, quantity")
      .eq("warehouse_id", form.warehouse_id)
      .eq("product_id", form.product_id)
      .maybeSingle();

    const delta = form.movement_type === "out" ? -qty : qty;

    if (existing) {
      await supabase.from("warehouse_stock").update({ quantity: Math.max(0, existing.quantity + delta) }).eq("id", existing.id);
    } else {
      await supabase.from("warehouse_stock").insert({ warehouse_id: form.warehouse_id, product_id: form.product_id, quantity: Math.max(0, delta) });
    }

    // Also update products.stock
    const { data: prod } = await supabase.from("products").select("stock").eq("id", form.product_id).single();
    if (prod) {
      await supabase.from("products").update({ stock: Math.max(0, prod.stock + delta) }).eq("id", form.product_id);
    }

    toast.success("Mișcare stoc înregistrată!");
    setDialogOpen(false);
    setForm({ product_id: "", warehouse_id: "", movement_type: "in", quantity: "", notes: "" });
    setSubmitting(false);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mișcări Stoc</h1>
          <p className="text-sm text-muted-foreground">Intrări, ieșiri, transferuri și ajustări stoc</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Adaugă mișcare</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Mișcare nouă de stoc</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tip mișcare</Label>
                <Select value={form.movement_type} onValueChange={(v) => setForm((p) => ({ ...p, movement_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">📥 Intrare</SelectItem>
                    <SelectItem value="out">📤 Ieșire</SelectItem>
                    <SelectItem value="transfer">🔄 Transfer</SelectItem>
                    <SelectItem value="adjustment">⚙️ Ajustare</SelectItem>
                    <SelectItem value="return">↩️ Retur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Produs *</Label>
                <Select value={form.product_id} onValueChange={(v) => setForm((p) => ({ ...p, product_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selectează produs" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Depozit *</Label>
                <Select value={form.warehouse_id} onValueChange={(v) => setForm((p) => ({ ...p, warehouse_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selectează depozit" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantitate *</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opțional..." />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Se salvează..." : "Înregistrează"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nicio mișcare de stoc înregistrată.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Tip</TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Depozit</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const t = typeLabels[m.movement_type] || typeLabels.in;
                  const Icon = t.icon;
                  return (
                    <TableRow key={m.id} className="border-border">
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className={`w-3 h-3 ${t.color}`} />
                          {t.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{m.product?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{m.warehouse?.name || "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={m.movement_type === "out" ? "text-red-400" : "text-green-400"}>
                          {m.movement_type === "out" ? "-" : "+"}{m.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{m.notes || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ro })}
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
