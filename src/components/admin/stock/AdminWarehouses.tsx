import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Warehouse, Trash2, Pencil, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WarehouseRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  type: string | null;
  code: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  principal: "Principal",
  secundar: "Secundar",
  dropshipping: "Dropshipping",
};

export default function AdminWarehouses() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRow | null>(null);

  // form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("principal");
  const [code, setCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("warehouses").select("*").order("is_default", { ascending: false }).order("name");
    setWarehouses((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName(""); setAddress(""); setCity(""); setType("principal"); setCode(""); setIsDefault(false); setIsActive(true);
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (w: WarehouseRow) => {
    setEditing(w);
    setName(w.name); setAddress(w.address || ""); setCity(w.city || "");
    setType(w.type || "principal"); setCode(w.code || "");
    setIsDefault(w.is_default); setIsActive(w.is_active);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;

    // If setting as default, unset others
    if (isDefault) {
      await supabase.from("warehouses").update({ is_default: false }).neq("id", editing?.id || "");
    }

    const payload = {
      name, address: address || null, city: city || null,
      type, code: code || null, is_default: isDefault, is_active: isActive,
    };

    if (editing) {
      await supabase.from("warehouses").update(payload).eq("id", editing.id);
      toast({ title: "Depozit actualizat" });
    } else {
      await supabase.from("warehouses").insert(payload);
      toast({ title: "Depozit adăugat" });
    }

    setDialogOpen(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    const w = warehouses.find(wh => wh.id === id);
    if (w?.is_default) { toast({ title: "Nu poți șterge depozitul implicit", variant: "destructive" }); return; }
    await supabase.from("warehouses").delete().eq("id", id);
    toast({ title: "Depozit șters" });
    load();
  };

  const setDefault = async (id: string) => {
    await supabase.from("warehouses").update({ is_default: false }).neq("id", id);
    await supabase.from("warehouses").update({ is_default: true }).eq("id", id);
    toast({ title: "Depozit implicit setat" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Warehouse className="w-5 h-5" /> Depozite</h1>
          <p className="text-sm text-muted-foreground">Gestionare depozite și locații de stoc.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Depozit nou</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Warehouse className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Niciun depozit definit.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Cod</TableHead>
                  <TableHead>Oraș</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Implicit</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{w.code || "—"}</TableCell>
                    <TableCell>{w.city || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabels[w.type || "principal"] || w.type}</Badge></TableCell>
                    <TableCell>
                      {w.is_active
                        ? <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Activ</Badge>
                        : <Badge variant="secondary">Inactiv</Badge>}
                    </TableCell>
                    <TableCell>
                      {w.is_default
                        ? <Badge className="bg-primary/20 text-primary border-primary/30"><Star className="w-3 h-3 mr-1" /> Implicit</Badge>
                        : <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDefault(w.id)}>Setează implicit</Button>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(w.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { resetForm(); } setDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editare depozit" : "Depozit nou"}</DialogTitle>
            <DialogDescription>Completează datele depozitului.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nume *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Depozit Central" /></div>
            <div><Label>Cod (opțional)</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="WH-01" /></div>
            <div><Label>Adresă</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Str. Exemplu nr. 1" /></div>
            <div><Label>Oraș</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="București" /></div>
            <div>
              <Label>Tip depozit</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="secundar">Secundar</SelectItem>
                  <SelectItem value="dropshipping">Dropshipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Activ</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Depozit implicit</Label>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            <Button className="w-full" onClick={save}>{editing ? "Salvează" : "Adaugă depozit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
