import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Factory, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  cui: string | null;
  lead_time_days: number | null;
  is_demo: boolean;
  created_at: string;
}

const EMPTY: Omit<Supplier, "id" | "created_at" | "is_demo"> = {
  name: "", contact_person: "", email: "", phone: "", address: "", notes: "", cui: "", lead_time_days: 7,
};

export default function AdminSuppliers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>({ ...EMPTY });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["supplier-product-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("supplier_id");
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { if (r.supplier_id) map[r.supplier_id] = (map[r.supplier_id] || 0) + 1; });
      return map;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Numele este obligatoriu");
      const payload = {
        name: form.name.trim(),
        contact_person: form.contact_person || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null,
        cui: form.cui || null,
        lead_time_days: form.lead_time_days || 7,
      };
      if (form.id) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(form.id ? "Furnizor actualizat" : "Furnizor adăugat");
      setOpen(false);
      setForm({ ...EMPTY });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-suppliers"] }); toast.success("Furnizor șters"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = suppliers.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cui?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setForm({
      id: s.id, name: s.name, contact_person: s.contact_person || "", email: s.email || "",
      phone: s.phone || "", address: s.address || "", notes: s.notes || "",
      cui: s.cui || "", lead_time_days: s.lead_time_days || 7,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Factory className="w-5 h-5" /> Furnizori</h1>
          <p className="text-sm text-muted-foreground">Gestionare furnizori, contacte, termen de livrare.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Furnizor nou</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută după nume, CUI, email…" className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Furnizor</TableHead>
                <TableHead>CUI</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Produse</TableHead>
                <TableHead>Termen livrare</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{suppliers.length === 0 ? "Nu sunt furnizori adăugați." : "Niciun rezultat."}</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {s.name}
                      {s.is_demo && <Badge variant="outline" className="text-xs">DEMO</Badge>}
                    </div>
                    {s.contact_person && <div className="text-xs text-muted-foreground">{s.contact_person}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.cui || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {s.email && <div>{s.email}</div>}
                    {s.phone && <div className="text-muted-foreground">{s.phone}</div>}
                    {!s.email && !s.phone && "—"}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{counts[s.id] || 0}</Badge></TableCell>
                  <TableCell>{s.lead_time_days ? `${s.lead_time_days} zile` : "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(`Șterge furnizorul "${s.name}"?`)) remove.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editează furnizor" : "Furnizor nou"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nume *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CUI</Label><Input value={form.cui} onChange={e => setForm(f => ({ ...f, cui: e.target.value }))} /></div>
              <div><Label>Termen livrare (zile)</Label><Input type="number" value={form.lead_time_days || ""} onChange={e => setForm(f => ({ ...f, lead_time_days: parseInt(e.target.value) || 7 }))} /></div>
            </div>
            <div><Label>Persoană de contact</Label><Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Adresă</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>Note</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Anulează</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
