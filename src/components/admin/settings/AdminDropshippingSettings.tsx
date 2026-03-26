import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Truck, Plus, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AdminDropshippingSettings() {
  const [settings, setSettings] = useState({
    enabled: false,
    auto_forward_orders: true,
    markup_percent: 30,
    hide_supplier_info: true,
    auto_update_stock: true,
    auto_update_prices: false,
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", api_url: "", api_key: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "dropshipping_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
    supabase.from("app_settings").select("value_json").eq("key", "dropshipping_suppliers").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSuppliers((data.value_json as any) || []); });
  }, []);

  const save = async () => {
    setSaving(true);
    await Promise.all([
      supabase.from("app_settings").upsert({ key: "dropshipping_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: "dropshipping_suppliers", value_json: suppliers as any, updated_at: new Date().toISOString() }, { onConflict: "key" }),
    ]);
    toast.success("Setări dropshipping salvate!");
    setSaving(false);
  };

  const addSupplier = () => {
    if (!form.name.trim()) return;
    setSuppliers(s => [...s, { ...form, id: crypto.randomUUID(), added: new Date().toISOString(), active: true }]);
    setForm({ name: "", api_url: "", api_key: "", email: "", notes: "" });
    setDialogOpen(false);
  };

  const removeSupplier = (id: string) => setSuppliers(s => s.filter(x => x.id !== id));
  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5" /> Dropshipping</h1>
          <p className="text-sm text-muted-foreground">Gestionează furnizori dropshipping, markup automat și forwarding comenzi.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Setări generale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>Activare mod dropshipping</Label><Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Markup implicit (%)</Label><Input type="number" value={settings.markup_percent} onChange={e => set("markup_percent", +e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Forward automat comenzi la furnizor</Label><Switch checked={settings.auto_forward_orders} onCheckedChange={v => set("auto_forward_orders", v)} /></div>
          <div className="flex items-center justify-between"><Label>Ascunde info furnizor pe facturi</Label><Switch checked={settings.hide_supplier_info} onCheckedChange={v => set("hide_supplier_info", v)} /></div>
          <div className="flex items-center justify-between"><Label>Update automat stocuri de la furnizor</Label><Switch checked={settings.auto_update_stock} onCheckedChange={v => set("auto_update_stock", v)} /></div>
          <div className="flex items-center justify-between"><Label>Update automat prețuri furnizor</Label><Switch checked={settings.auto_update_prices} onCheckedChange={v => set("auto_update_prices", v)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Furnizori Dropshipping</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă furnizor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Furnizor nou</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nume furnizor</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Email contact</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>API URL (opțional)</Label><Input value={form.api_url} onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))} /></div>
                <div><Label>API Key (opțional)</Label><Input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} /></div>
                <div><Label>Note</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button onClick={addSupplier} disabled={!form.name.trim()}>Adaugă</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Niciun furnizor adăugat.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Furnizor</TableHead><TableHead>Email</TableHead><TableHead>API</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm">{s.email || "—"}</TableCell>
                    <TableCell><Badge variant={s.api_url ? "default" : "secondary"}>{s.api_url ? "Configurat" : "Manual"}</Badge></TableCell>
                    <TableCell><Badge variant="default">Activ</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSupplier(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
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
