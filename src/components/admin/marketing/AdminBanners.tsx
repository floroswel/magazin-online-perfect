import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image, Copy, Eye, Search, Filter, ToggleLeft, ArrowUp, ArrowDown, Calendar, Megaphone, Layout, ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Banner = Tables<"banners">;

const PLACEMENTS = [
  { value: "homepage", label: "Homepage" },
  { value: "category", label: "Categorie" },
  { value: "popup", label: "Popup" },
  { value: "sidebar", label: "Sidebar" },
  { value: "promo", label: "Bară promoțională" },
  { value: "product", label: "Pagină produs" },
  { value: "cart", label: "Coș" },
  { value: "checkout", label: "Checkout" },
];

const EMPTY_FORM = {
  title: "", subtitle: "", image_url: "", link_url: "",
  cta_text: "", cta_link: "", badge_text: "", bg_color: "#ffffff",
  placement: "homepage", sort_order: 0, active: true,
  starts_at: "", ends_at: "",
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterPlacement, setFilterPlacement] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);

  const load = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Stats
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter(b => b.active).length;
    const scheduled = banners.filter(b => b.starts_at && new Date(b.starts_at) > new Date()).length;
    const expired = banners.filter(b => b.ends_at && new Date(b.ends_at) < new Date()).length;
    return { total, active, scheduled, expired };
  }, [banners]);

  // Filtering
  const filtered = useMemo(() => {
    let list = banners;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(s) || b.subtitle?.toLowerCase().includes(s) || b.badge_text?.toLowerCase().includes(s));
    }
    if (filterPlacement !== "all") list = list.filter(b => b.placement === filterPlacement);
    if (filterStatus === "active") list = list.filter(b => b.active);
    if (filterStatus === "inactive") list = list.filter(b => !b.active);
    if (filterStatus === "scheduled") list = list.filter(b => b.starts_at && new Date(b.starts_at) > new Date());
    if (filterStatus === "expired") list = list.filter(b => b.ends_at && new Date(b.ends_at) < new Date());
    return list;
  }, [banners, search, filterPlacement, filterStatus]);

  const getStatus = (b: Banner) => {
    if (b.ends_at && new Date(b.ends_at) < new Date()) return { label: "Expirat", variant: "destructive" as const };
    if (b.starts_at && new Date(b.starts_at) > new Date()) return { label: "Programat", variant: "secondary" as const };
    if (b.active) return { label: "Activ", variant: "default" as const };
    return { label: "Inactiv", variant: "outline" as const };
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle || "", image_url: b.image_url || "",
      link_url: b.link_url || "", cta_text: b.cta_text || "", cta_link: b.cta_link || "",
      badge_text: b.badge_text || "", bg_color: b.bg_color || "#ffffff",
      placement: b.placement, sort_order: b.sort_order, active: b.active,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const duplicate = (b: Banner) => {
    setEditing(null);
    setForm({
      title: b.title + " (copie)", subtitle: b.subtitle || "", image_url: b.image_url || "",
      link_url: b.link_url || "", cta_text: b.cta_text || "", cta_link: b.cta_link || "",
      badge_text: b.badge_text || "", bg_color: b.bg_color || "#ffffff",
      placement: b.placement, sort_order: b.sort_order + 1, active: false,
      starts_at: "", ends_at: "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Titlul este obligatoriu"); return; }
    const payload = {
      title: form.title, subtitle: form.subtitle || null,
      image_url: form.image_url || null, link_url: form.link_url || null,
      cta_text: form.cta_text || null, cta_link: form.cta_link || null,
      badge_text: form.badge_text || null, bg_color: form.bg_color || null,
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

  const bulkToggle = async (active: boolean) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase.from("banners").update({ active }).in("id", ids);
    toast.success(`${ids.length} bannere ${active ? "activate" : "dezactivate"}`);
    setSelected(new Set());
    load();
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Ștergi ${selected.size} bannere selectate?`)) return;
    await supabase.from("banners").delete().in("id", Array.from(selected));
    toast.success(`${selected.size} bannere șterse`);
    setSelected(new Set());
    load();
  };

  const moveOrder = async (b: Banner, dir: -1 | 1) => {
    const newOrder = b.sort_order + dir;
    await supabase.from("banners").update({ sort_order: newOrder }).eq("id", b.id);
    load();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ active: !b.active }).eq("id", b.id);
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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.id)));
  };

  const placementLabel = (p: string) => PLACEMENTS.find(pl => pl.value === p)?.label || p;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Bannere & Promoții
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează bannere vizuale, bare promoționale și popups.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Banner nou</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total bannere</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active acum</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
          <p className="text-xs text-muted-foreground">Programate</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
          <p className="text-xs text-muted-foreground">Expirate</p>
        </CardContent></Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută titlu, subtitlu, badge..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filterPlacement} onValueChange={setFilterPlacement}>
          <SelectTrigger className="w-[160px]"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Plasare" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate plasările</SelectItem>
            {PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="scheduled">Programate</SelectItem>
            <SelectItem value="expired">Expirate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.size} selectate</span>
          <Button size="sm" variant="outline" onClick={() => bulkToggle(true)}>
            <ToggleLeft className="w-3 h-3 mr-1" /> Activează
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkToggle(false)}>Dezactivează</Button>
          <Button size="sm" variant="destructive" onClick={bulkDelete}>
            <Trash2 className="w-3 h-3 mr-1" /> Șterge
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="w-16">Preview</TableHead>
                  <TableHead>Titlu</TableHead>
                  <TableHead>Plasare</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Programare</TableHead>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => {
                  const status = getStatus(b);
                  return (
                    <TableRow key={b.id} className={selected.has(b.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} />
                      </TableCell>
                      <TableCell>
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.title} className="h-10 w-16 object-cover rounded border cursor-pointer" onClick={() => setPreviewBanner(b)} />
                        ) : (
                          <div className="h-10 w-16 rounded border flex items-center justify-center cursor-pointer" style={{ backgroundColor: b.bg_color || undefined }} onClick={() => setPreviewBanner(b)}>
                            <Layout className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{b.title}</p>
                          {b.subtitle && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.subtitle}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{placementLabel(b.placement)}</Badge>
                      </TableCell>
                      <TableCell>
                        {b.badge_text && <Badge variant="secondary" className="text-xs">{b.badge_text}</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.starts_at || b.ends_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {b.starts_at ? new Date(b.starts_at).toLocaleDateString("ro-RO") : "—"}
                              {" → "}
                              {b.ends_at ? new Date(b.ends_at).toLocaleDateString("ro-RO") : "∞"}
                            </span>
                          </div>
                        ) : "Permanent"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveOrder(b, -1)}><ArrowUp className="w-3 h-3" /></Button>
                          <span className="text-xs w-5 text-center">{b.sort_order}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveOrder(b, 1)}><ArrowDown className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={b.active} onCheckedChange={() => toggleActive(b)} className="scale-75" />
                          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" onClick={() => setPreviewBanner(b)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editează" onClick={() => openEdit(b)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplică" onClick={() => duplicate(b)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Șterge" onClick={() => remove(b.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      {banners.length === 0 ? "Niciun banner creat încă." : "Niciun rezultat pentru filtrele aplicate."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editează Banner" : "Banner Nou"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Conținut</TabsTrigger>
              <TabsTrigger value="design">Design & CTA</TabsTrigger>
              <TabsTrigger value="schedule">Programare</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <Label>Titlu *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Colecția Primăvară 2025" />
              </div>
              <div>
                <Label>Subtitlu</Label>
                <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} rows={2} placeholder="Text secundar afișat sub titlu" />
              </div>
              <div>
                <Label>Imagine banner</Label>
                {form.image_url && <img src={form.image_url} alt="" className="h-24 rounded mb-2 object-cover" />}
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                <Input className="mt-1" placeholder="sau URL imagine extern" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>
              <div>
                <Label>Link URL (click pe banner)</Label>
                <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="/catalog sau https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plasare</Label>
                  <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordine afișare</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4 mt-4">
              <div>
                <Label>Badge text</Label>
                <Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="Ex: NOU, -30%, EXCLUSIV" />
                <p className="text-xs text-muted-foreground mt-1">Etichetă vizuală afișată peste banner</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Text buton CTA</Label>
                  <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="Cumpără acum" />
                </div>
                <div>
                  <Label>Link CTA</Label>
                  <Input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="/catalog/oferte" />
                </div>
              </div>
              <div>
                <Label>Culoare fundal</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="w-16 h-10 p-1" />
                  <Input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" placeholder="#ffffff" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Folosit ca fallback când nu este setată o imagine</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label>Activ</Label>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Opțional — programează afișarea automată a banner-ului.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dată & oră start</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Dată & oră sfârșit</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <p>• Lasă ambele câmpuri goale pentru afișare permanentă.</p>
                <p>• Setează doar start pentru a activa de la o anumită dată.</p>
                <p>• Setează ambele pentru campanii cu durată fixă.</p>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button onClick={save}>{editing ? "Salvează modificările" : "Creează banner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Preview Banner</DialogTitle></DialogHeader>
          {previewBanner && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: previewBanner.bg_color || "#f5f5f5" }}>
                {previewBanner.image_url ? (
                  <img src={previewBanner.image_url} alt={previewBanner.title} className="w-full max-h-[300px] object-cover" />
                ) : (
                  <div className="p-8 text-center">
                    {previewBanner.badge_text && (
                      <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-medium mb-2">{previewBanner.badge_text}</span>
                    )}
                    <h2 className="text-2xl font-bold">{previewBanner.title}</h2>
                    {previewBanner.subtitle && <p className="text-muted-foreground mt-1">{previewBanner.subtitle}</p>}
                    {previewBanner.cta_text && (
                      <Button className="mt-4" size="sm">{previewBanner.cta_text} <ExternalLink className="w-3 h-3 ml-1" /></Button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Plasare:</span> {placementLabel(previewBanner.placement)}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={getStatus(previewBanner).variant}>{getStatus(previewBanner).label}</Badge></div>
                {previewBanner.link_url && <div className="col-span-2"><span className="text-muted-foreground">Link:</span> {previewBanner.link_url}</div>}
                {previewBanner.cta_link && <div className="col-span-2"><span className="text-muted-foreground">CTA Link:</span> {previewBanner.cta_link}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
