import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Bell, BellOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  alert_type: string;
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  resolved_at: string | null;
  product: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
}

const alertLabels: Record<string, { label: string; color: string }> = {
  low_stock: { label: "Stoc scăzut", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  out_of_stock: { label: "Fără stoc", color: "bg-destructive/20 text-destructive border-destructive/30" },
  overstock: { label: "Suprastoc", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export default function AdminStockAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", warehouse_id: "", alert_type: "low_stock", threshold: "5" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [{ data: aData }, { data: pData }, { data: wData }] = await Promise.all([
      supabase.from("stock_alerts").select("id, alert_type, threshold, is_active, triggered_at, resolved_at, product:products(id, name), warehouse:warehouses(id, name)").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").order("name"),
      supabase.from("warehouses").select("id, name").order("name"),
    ]);
    if (aData) setAlerts(aData as any);
    if (pData) setProducts(pData);
    if (wData) setWarehouses(wData);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!form.product_id || !form.threshold) { toast.error("Completează câmpurile obligatorii"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("stock_alerts").insert({
      product_id: form.product_id,
      warehouse_id: form.warehouse_id || null,
      alert_type: form.alert_type,
      threshold: parseInt(form.threshold),
    });
    if (error) { toast.error("Eroare la creare"); setSubmitting(false); return; }
    toast.success("Alertă creată!");
    setDialogOpen(false);
    setForm({ product_id: "", warehouse_id: "", alert_type: "low_stock", threshold: "5" });
    setSubmitting(false);
    fetchAll();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("stock_alerts").update({ is_active: !current }).eq("id", id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a));
  };

  const deleteAlert = async (id: string) => {
    await supabase.from("stock_alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alertă ștearsă");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerte Stoc</h1>
          <p className="text-sm text-muted-foreground">Configurare alerte pentru stoc minim, fără stoc sau suprastoc</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Alertă nouă</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Alertă nouă de stoc</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tip alertă</Label>
                <Select value={form.alert_type} onValueChange={(v) => setForm((p) => ({ ...p, alert_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_stock">⚠️ Stoc scăzut</SelectItem>
                    <SelectItem value="out_of_stock">🚫 Fără stoc</SelectItem>
                    <SelectItem value="overstock">📦 Suprastoc</SelectItem>
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
                <Label>Depozit (opțional)</Label>
                <Select value={form.warehouse_id} onValueChange={(v) => setForm((p) => ({ ...p, warehouse_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Toate depozitele" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prag (cantitate)</Label>
                <Input type="number" min="0" value={form.threshold} onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full">
                {submitting ? "Se creează..." : "Creează alertă"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nicio alertă configurată.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Produs</TableHead>
                  <TableHead>Depozit</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Prag</TableHead>
                  <TableHead>Activ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a) => {
                  const al = alertLabels[a.alert_type] || alertLabels.low_stock;
                  return (
                    <TableRow key={a.id} className="border-border">
                      <TableCell className="font-medium">{a.product?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.warehouse?.name || "Toate"}</TableCell>
                      <TableCell><Badge className={al.color}>{al.label}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{a.threshold}</TableCell>
                      <TableCell>
                        <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteAlert(a.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
