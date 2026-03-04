import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Banner = Tables<"banners">;

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", image_url: "", link_url: "", placement: "homepage", sort_order: 0, active: true, starts_at: "", ends_at: "" });

  const load = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", image_url: "", link_url: "", placement: "homepage", sort_order: 0, active: true, starts_at: "", ends_at: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title, image_url: b.image_url || "", link_url: b.link_url || "",
      placement: b.placement, sort_order: b.sort_order, active: b.active,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "", ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      title: form.title, image_url: form.image_url || null, link_url: form.link_url || null,
      placement: form.placement, sort_order: form.sort_order, active: form.active,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
    };
    if (editing) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Banner actualizat");
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Banner creat");
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi acest banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Banner șters");
    load();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Eroare upload: " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: publicUrl }));
    toast.success("Imagine încărcată");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bannere & Popups</CardTitle>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Adaugă Banner</Button>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Se încarcă...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagine</TableHead>
                <TableHead>Titlu</TableHead>
                <TableHead>Plasare</TableHead>
                <TableHead>Ordine</TableHead>
                <TableHead>Activ</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    {b.image_url ? <img src={b.image_url} alt={b.title} className="h-10 w-16 object-cover rounded" /> : <Image className="h-10 w-10 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.placement}</TableCell>
                  <TableCell>{b.sort_order}</TableCell>
                  <TableCell>{b.active ? "✅" : "❌"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Niciun banner</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editează Banner" : "Banner Nou"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titlu</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div>
              <Label>Imagine</Label>
              {form.image_url && <img src={form.image_url} alt="" className="h-20 rounded mb-2" />}
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              <Input className="mt-1" placeholder="sau URL imagine" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            </div>
            <div><Label>Link URL</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plasare</Label>
                <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homepage">Homepage</SelectItem>
                    <SelectItem value="category">Categorie</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Ordine</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Început</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
              <div><Label>Sfârșit</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Activ</Label>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{editing ? "Salvează" : "Creează"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
