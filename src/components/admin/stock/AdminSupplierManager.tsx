import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Save, Loader2, Truck, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function useModuleEnabled() {
  return useQuery({
    queryKey: ["stock-manager-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "stock_manager_enabled")
        .maybeSingle();
      return data?.value_json === true;
    },
  });
}

export default function AdminSupplierManager() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading: loadingEnabled } = useModuleEnabled();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suppliers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: enabled === true,
  });

  const resetForm = () => {
    setName(""); setContactPerson(""); setEmail(""); setPhone(""); setAddress(""); setNotes("");
    setEditId(null); setShowForm(false);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setName(s.name || "");
    setContactPerson(s.contact_person || "");
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setNotes(s.notes || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Numele furnizorului este obligatoriu"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        const { error } = await supabase.from("suppliers" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers" as any).insert(payload);
        if (error) throw error;
      }
      toast.success(editId ? "Furnizor actualizat!" : "Furnizor adăugat!");
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success("Furnizor șters!");
    },
  });

  if (loadingEnabled) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  if (!enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Manager Stocuri Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">Activează din Setări → Manager Stocuri.</p>
          <Link to="/admin/settings/stock-manager">
            <Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const filtered = searchTerm
    ? suppliers.filter((s: any) => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : suppliers;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Furnizori</h1>
          <p className="text-sm text-muted-foreground">Gestiune furnizori pentru aprovizionare</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Adaugă furnizor</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută furnizor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toți furnizorii</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denumire</TableHead>
                <TableHead>Persoana contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Niciun furnizor.</TableCell></TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.contact_person || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ id: s.id, name: s.name })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editare furnizor" : "Adaugă furnizor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Denumire furnizor *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Persoana contact</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Telefon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <div><Label>Adresă</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div><Label>Note interne</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Anulează</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              {editId ? "Actualizează" : "Creează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmare ștergere</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ștergi furnizorul <strong>{deleteConfirm?.name}</strong>? Comenzile existente vor păstra snapshot-ul numelui.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anulează</Button>
            <Button variant="destructive" onClick={() => { deleteMutation.mutate(deleteConfirm!.id); setDeleteConfirm(null); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
