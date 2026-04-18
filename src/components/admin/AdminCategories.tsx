import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Eye, EyeOff, Upload, Image as ImageIcon, GripVertical, Zap, X } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  display_order: number;
  visible: boolean;
  show_in_nav: boolean;
  banner_image: string | null;
  banner_link: string | null;
  created_at: string;
}

const emptyForm = {
  name: "", slug: "", icon: "", parent_id: "",
  description: "", image_url: "", meta_title: "", meta_description: "",
  display_order: 0, visible: true, show_in_nav: true,
  banner_image: "", banner_link: "",
};

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Product counts per category
  const { data: productCounts = {} } = useQuery({
    queryKey: ["admin-category-product-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("category_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      return counts;
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (file: File, target: "image_url" | "banner_image") => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, [target]: url }));
      toast.success("Imagine încărcată!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload: any = {
        name: values.name,
        slug: values.slug,
        icon: values.icon || null,
        parent_id: values.parent_id || null,
        description: values.description || null,
        image_url: values.image_url || null,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        display_order: values.display_order,
        visible: values.visible,
        show_in_nav: values.show_in_nav,
        banner_image: values.banner_image || null,
        banner_link: values.banner_link || null,
      };
      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editingId ? "Categorie actualizată!" : "Categorie adăugată!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categorie ștearsă!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from("categories").update({ visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      await Promise.all(
        updates.map((u) =>
          supabase.from("categories").update({ display_order: u.display_order }).eq("id", u.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Ordine actualizată");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [dragId, setDragId] = useState<string | null>(null);
  const handleDrop = (targetId: string, parentId: string | null) => {
    if (!dragId || dragId === targetId) return;
    const siblings = categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);
    const fromIdx = siblings.findIndex((s) => s.id === dragId);
    const toIdx = siblings.findIndex((s) => s.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reorderMutation.mutate(reordered.map((c, i) => ({ id: c.id, display_order: i })));
    setDragId(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openNew = (parentId?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, parent_id: parentId || "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name, slug: cat.slug, icon: cat.icon || "",
      parent_id: cat.parent_id || "",
      description: cat.description || "", image_url: cat.image_url || "",
      meta_title: cat.meta_title || "", meta_description: cat.meta_description || "",
      display_order: cat.display_order, visible: cat.visible,
      show_in_nav: cat.show_in_nav,
      banner_image: cat.banner_image || "", banner_link: cat.banner_link || "",
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = editingId ? form.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setForm(p => ({ ...p, name, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Numele și slug-ul sunt obligatorii.");
      return;
    }
    upsertMutation.mutate(form);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Build tree
  const getChildren = (parentId: string | null) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));

  const roots = getChildren(null);

  const filtered = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))
    : null;

  // Recursive count (includes children products)
  const getTotalProducts = (catId: string): number => {
    let count = productCounts[catId] || 0;
    getChildren(catId).forEach(child => { count += getTotalProducts(child.id); });
    return count;
  };

  const renderTreeRow = (cat: Category, depth: number) => {
    const children = getChildren(cat.id);
    const hasChildren = children.length > 0;
    const expanded = expandedIds.has(cat.id);
    const prodCount = getTotalProducts(cat.id);

    return (
      <div key={cat.id}>
        <div
          draggable
          onDragStart={() => setDragId(cat.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(cat.id, cat.parent_id)}
          className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md group cursor-move"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-40 group-hover:opacity-100" />
          {hasChildren ? (
            <button onClick={() => toggleExpand(cat.id)} className="p-0.5 rounded hover:bg-muted">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : <span className="w-5" />}
          {cat.icon ? <span className="text-lg">{cat.icon}</span> : null}
          <span className="font-medium text-foreground flex-1">{cat.name}</span>
          <span className="text-xs text-muted-foreground">{prodCount} prod.</span>
          <Switch
            checked={cat.visible}
            onCheckedChange={(v) => toggleVisibility.mutate({ id: cat.id, visible: v })}
            className="scale-75"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openNew(cat.id)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(cat)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
            onClick={() => { if (confirm(`Ștergi categoria "${cat.name}"?`)) deleteMutation.mutate(cat.id); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        {hasChildren && expanded && children.map(child => renderTreeRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Categorii ({categories.length})</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Caută categorii..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Link to="/admin/categories/smart">
            <Button variant="outline" className="gap-2"><Zap className="w-4 h-4" /> Smart</Button>
          </Link>
          <Button onClick={() => openNew()} className="gap-2"><Plus className="w-4 h-4" /> Adaugă</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="border rounded-lg p-2 space-y-0.5">
          {(filtered || roots).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nicio categorie găsită.</p>
          ) : filtered ? (
            filtered.map(cat => renderTreeRow(cat, 0))
          ) : (
            roots.map(cat => renderTreeRow(cat, 0))
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editează Categorie" : "Categorie Nouă"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nume *</Label>
                <Input value={form.name} onChange={e => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required />
              </div>
            </div>

            {/* Icon & Parent */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (emoji) <span className="text-muted-foreground font-normal">– opțional</span></Label>
                <div className="flex gap-2">
                  <Input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="📱" className="flex-1" />
                  {form.icon && (
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setForm(p => ({ ...p, icon: "" }))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>Categorie Părinte</Label>
                <Select value={form.parent_id || "none"} onValueChange={v => setForm(p => ({ ...p, parent_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Fără părinte" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără părinte</SelectItem>
                    {categories.filter(c => c.id !== editingId).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Descriere</Label>
              <RichTextEditor content={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
            </div>

            {/* Category Image */}
            <div>
              <Label>Imagine Categorie</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded border" />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>
                )}
                <div>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "image_url"); }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Încarcă
                  </Button>
                  {form.image_url && <Button type="button" variant="ghost" size="sm" onClick={() => setForm(p => ({ ...p, image_url: "" }))}>Șterge</Button>}
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="font-semibold">Banner Promoțional</Label>
              <div className="flex items-center gap-3">
                {form.banner_image ? (
                  <img src={form.banner_image} alt="" className="h-16 max-w-[200px] object-cover rounded border" />
                ) : (
                  <div className="h-16 w-32 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">Fără banner</div>
                )}
                <div className="space-y-1">
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "banner_image"); }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => bannerInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Încarcă Banner
                  </Button>
                  {form.banner_image && <Button type="button" variant="ghost" size="sm" onClick={() => setForm(p => ({ ...p, banner_image: "" }))}>Șterge</Button>}
                </div>
              </div>
              <div>
                <Label>Link Banner</Label>
                <Input value={form.banner_link} onChange={e => setForm(p => ({ ...p, banner_link: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            {/* Display order */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ordine Afișare</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.visible} onCheckedChange={v => setForm(p => ({ ...p, visible: v }))} />
                <Label>Vizibil pe site</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.show_in_nav} onCheckedChange={v => setForm(p => ({ ...p, show_in_nav: v }))} />
                <Label>Afișare în navigare</Label>
              </div>
            </div>

            {/* SEO */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="font-semibold">SEO</Label>
              <div>
                <Label className="text-xs">Meta Title</Label>
                <Input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} placeholder={form.name || "Titlu pagină"} />
              </div>
              <div>
                <Label className="text-xs">Meta Description</Label>
                <Input value={form.meta_description} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))} placeholder="Descriere scurtă pentru motoarele de căutare" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Se salvează..." : editingId ? "Actualizează" : "Salvează"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
