import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Pencil, Trash2, Search, Upload, X, Image as ImageIcon,
  ChevronRight, ChevronLeft, Package, DollarSign, Warehouse, Camera, Globe,
  Copy, Eye, Check, Layers, Sparkles, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───
interface ProductForm {
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  stock: number;
  description: string;
  brand: string;
  image_url: string;
  images: string[];
  featured: boolean;
  category_id: string | null;
  specs: Record<string, string>;
  meta_title: string;
  meta_description: string;
}

interface Variant {
  id: string;
  attribute: string;
  values: string[];
}

const STEPS = [
  { key: "basic", label: "Bază", icon: <Package className="w-4 h-4" /> },
  { key: "pricing", label: "Prețuri", icon: <DollarSign className="w-4 h-4" /> },
  { key: "inventory", label: "Stoc", icon: <Warehouse className="w-4 h-4" /> },
  { key: "media", label: "Media", icon: <Camera className="w-4 h-4" /> },
  { key: "seo", label: "SEO", icon: <Globe className="w-4 h-4" /> },
];

const emptyForm: ProductForm = {
  name: "", slug: "", price: 0, old_price: null, stock: 0,
  description: "", brand: "", image_url: "", images: [], featured: false,
  category_id: null, specs: {}, meta_title: "", meta_description: "",
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [removingBg, setRemovingBg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const removeBackground = async (imageUrl: string, target: "main" | number) => {
    setRemovingBg(target === "main" ? "main" : `gallery-${target}`);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { image_url: imageUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (target === "main") {
        setForm((f) => ({ ...f, image_url: data.url }));
      } else {
        setForm((f) => ({
          ...f,
          images: f.images.map((img, i) => (i === target ? data.url : img)),
        }));
      }
      toast.success("Fundal eliminat cu succes!");
    } catch (err: any) {
      toast.error(err.message || "Eroare la eliminarea fundalului");
    }
    setRemovingBg(null);
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Imagine încărcată!");
    } catch (err: any) {
      toast.error("Eroare: " + err.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} imagini încărcate!`);
    } catch (err: any) {
      toast.error("Eroare: " + err.message);
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const saveMutation = useMutation({
    mutationFn: async (product: ProductForm & { id?: string }) => {
      const payload: any = {
        name: product.name,
        slug: product.slug,
        price: product.price,
        old_price: product.old_price,
        stock: product.stock,
        description: product.description,
        brand: product.brand,
        image_url: product.image_url,
        images: product.images,
        featured: product.featured,
        category_id: product.category_id,
        specs: {
          ...product.specs,
          ...(variants.length > 0 ? { _variants: variants } : {}),
          ...(product.meta_title ? { _meta_title: product.meta_title } : {}),
          ...(product.meta_description ? { _meta_description: product.meta_description } : {}),
        },
      };
      if (product.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setStep(0);
      setVariants([]);
      toast.success(editingId ? "Produs actualizat!" : "Produs adăugat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteConfirm(null);
      toast.success("Produs șters!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (product: any) => {
    const specs = product.specs || {};
    const savedVariants = specs._variants || [];
    const { _variants, _meta_title, _meta_description, ...cleanSpecs } = specs;
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      price: product.price,
      old_price: product.old_price,
      stock: product.stock,
      description: product.description || "",
      brand: product.brand || "",
      image_url: product.image_url || "",
      images: product.images || [],
      featured: product.featured || false,
      category_id: product.category_id || null,
      specs: cleanSpecs,
      meta_title: _meta_title || "",
      meta_description: _meta_description || "",
    });
    setVariants(savedVariants);
    setStep(0);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setVariants([]);
    setStep(0);
    setDialogOpen(true);
  };

  const addVariant = () => {
    setVariants((v) => [...v, { id: crypto.randomUUID(), attribute: "", values: [""] }]);
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants((vs) => vs.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants((vs) => vs.filter((v) => v.id !== id));
  };

  const addSpec = () => {
    if (!specKey.trim()) return;
    setForm((f) => ({ ...f, specs: { ...f.specs, [specKey.trim()]: specVal.trim() } }));
    setSpecKey("");
    setSpecVal("");
  };

  const removeSpec = (key: string) => {
    setForm((f) => {
      const { [key]: _, ...rest } = f.specs;
      return { ...f, specs: rest };
    });
  };

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.price > 0;
    return true;
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Completează numele și prețul!");
      return;
    }
    saveMutation.mutate({ ...form, slug: form.slug || generateSlug(form.name), id: editingId || undefined });
  };

  // ─── Wizard Steps ───
  const renderStep = () => {
    switch (step) {
      case 0: // Basic
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nume produs *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: !editingId ? generateSlug(name) : f.slug }));
                }}
                placeholder="ex: Samsung Galaxy S24 Ultra"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="samsung-galaxy-s24-ultra" />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Samsung" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără categorie</SelectItem>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descriere</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!form.name.trim() || generatingDesc}
                  onClick={async () => {
                    setGeneratingDesc(true);
                    try {
                      const categoryName = categories.find((c: any) => c.id === form.category_id)?.name;
                      const { data, error } = await supabase.functions.invoke("generate-description", {
                        body: { name: form.name, brand: form.brand, category: categoryName, specs: form.specs },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      setForm((f) => ({ ...f, description: data.description }));
                      toast.success("Descriere generată cu AI!");
                    } catch (err: any) {
                      toast.error(err.message || "Eroare la generare");
                    }
                    setGeneratingDesc(false);
                  }}
                  className="gap-1.5 text-xs"
                >
                  {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generatingDesc ? "Generez..." : "Generează cu AI"}
                </Button>
              </div>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descrierea produsului..." />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} id="featured" />
              <Label htmlFor="featured">Produs recomandat (afișat pe homepage)</Label>
            </div>

            {/* Specs */}
            <div className="space-y-2">
              <Label>Specificații tehnice</Label>
              {Object.entries(form.specs).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(form.specs).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-1.5">
                      <span className="font-medium text-foreground">{k}:</span>
                      <span className="text-muted-foreground flex-1">{v}</span>
                      <button type="button" onClick={() => removeSpec(k)} className="text-destructive hover:text-destructive/80">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Cheie (ex: Memorie)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1" />
                <Input placeholder="Valoare (ex: 12GB)" value={specVal} onChange={(e) => setSpecVal(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addSpec} disabled={!specKey.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 1: // Pricing
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preț (RON) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="199.99" />
              </div>
              <div className="space-y-2">
                <Label>Preț vechi (RON)</Label>
                <Input type="number" step="0.01" min="0" value={form.old_price ?? ""} onChange={(e) => setForm({ ...form, old_price: e.target.value ? Number(e.target.value) : null })} placeholder="299.99" />
              </div>
            </div>
            {form.old_price && form.old_price > form.price && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
                <span className="text-green-400 font-medium">
                  Reducere: {Math.round(((form.old_price - form.price) / form.old_price) * 100)}%
                </span>
                <span className="text-muted-foreground ml-2">
                  (economie {(form.old_price - form.price).toFixed(2)} RON)
                </span>
              </div>
            )}

            {/* Variants Builder */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Variante produs
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1">
                  <Plus className="w-4 h-4" /> Adaugă atribut
                </Button>
              </div>
              {variants.length === 0 && (
                <p className="text-sm text-muted-foreground">Nicio variantă. Adaugă atribute precum Culoare, Mărime, Capacitate etc.</p>
              )}
              {variants.map((variant) => (
                <Card key={variant.id} className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nume atribut (ex: Culoare)"
                        value={variant.attribute}
                        onChange={(e) => updateVariant(variant.id, "attribute", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeVariant(variant.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Valori</Label>
                      <div className="flex flex-wrap gap-2">
                        {variant.values.map((val, vi) => (
                          <div key={vi} className="flex items-center gap-1">
                            <Input
                              value={val}
                              onChange={(e) => {
                                const newVals = [...variant.values];
                                newVals[vi] = e.target.value;
                                updateVariant(variant.id, "values", newVals);
                              }}
                              placeholder={`Valoare ${vi + 1}`}
                              className="w-32 h-8 text-sm"
                            />
                            {variant.values.length > 1 && (
                              <button type="button" onClick={() => updateVariant(variant.id, "values", variant.values.filter((_, i) => i !== vi))} className="text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updateVariant(variant.id, "values", [...variant.values, ""])}>
                          <Plus className="w-3 h-3 mr-1" /> Valoare
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {variants.length > 0 && variants.every((v) => v.attribute && v.values.some((val) => val)) && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Combinații generate:</p>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const combos = variants.reduce<string[][]>(
                        (acc, v) => {
                          const filtered = v.values.filter(Boolean);
                          if (!filtered.length) return acc;
                          if (!acc.length) return filtered.map((val) => [`${v.attribute}: ${val}`]);
                          return acc.flatMap((combo) => filtered.map((val) => [...combo, `${v.attribute}: ${val}`]));
                        }, []
                      );
                      return combos.slice(0, 20).map((combo, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{combo.join(" / ")}</Badge>
                      ));
                    })()}
                    {(() => {
                      const total = variants.reduce((acc, v) => acc * (v.values.filter(Boolean).length || 1), 1);
                      return total > 20 ? <Badge variant="secondary" className="text-xs">+{total - 20} altele</Badge> : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Inventory
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stoc disponibil *</Label>
              <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className={cn(
              "rounded-lg p-4 text-sm",
              form.stock === 0 ? "bg-destructive/10 border border-destructive/20" :
              form.stock <= 5 ? "bg-yellow-500/10 border border-yellow-500/20" :
              "bg-green-500/10 border border-green-500/20"
            )}>
              {form.stock === 0 ? (
                <p className="text-destructive font-medium">⚠️ Stoc epuizat — produsul nu va fi disponibil pentru cumpărare</p>
              ) : form.stock <= 5 ? (
                <p className="text-yellow-500 font-medium">⚡ Stoc scăzut — se recomandă reaprovizionare</p>
              ) : (
                <p className="text-green-400 font-medium">✓ Stoc suficient</p>
              )}
            </div>
          </div>
        );

      case 3: // Media
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagine principală</Label>
              <div className="flex gap-3 items-start">
                {form.image_url ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-1" /> {uploading ? "Se încarcă..." : "Încarcă imagine"}
                    </Button>
                    {form.image_url && (
                      <Button
                        type="button" variant="outline" size="sm"
                        disabled={removingBg === "main"}
                        onClick={() => removeBackground(form.image_url, "main")}
                        className="gap-1.5"
                      >
                        {removingBg === "main" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {removingBg === "main" ? "Procesez..." : "Elimină fundal (AI)"}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">sau introdu URL:</p>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="text-xs" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Galerie imagini ({form.images.length})</Label>
              <div className="flex flex-wrap gap-2">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={removingBg === `gallery-${idx}`}
                      onClick={() => removeBackground(url, idx)}
                      className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Elimină fundal"
                    >
                      {removingBg === `gallery-${idx}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
                <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading} className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground/60">Adaugă</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 4: // SEO
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meta titlu</Label>
              <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder={form.name || "Titlu pagină produs"} maxLength={60} />
              <p className="text-xs text-muted-foreground">{(form.meta_title || form.name).length}/60 caractere</p>
            </div>
            <div className="space-y-2">
              <Label>Meta descriere</Label>
              <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Descriere scurtă pentru motoarele de căutare..." rows={3} maxLength={160} />
              <p className="text-xs text-muted-foreground">{form.meta_description.length}/160 caractere</p>
            </div>
            {/* Google Preview */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preview Google</Label>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <p className="text-blue-400 text-sm font-medium truncate">{form.meta_title || form.name || "Titlu produs"}</p>
                <p className="text-xs text-green-500">example.ro/product/{form.slug || "slug-produs"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{form.meta_description || form.description?.slice(0, 160) || "Descriere produs..."}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produse ({products.length})</h1>
          <p className="text-sm text-muted-foreground">Gestionare catalog de produse</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)} disabled={bulkDeleting} className="gap-2">
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? "Se șterg..." : `Șterge ${selectedIds.size} produse`}
            </Button>
          )}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Caută produse..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" />
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Produs Nou
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((p: any) => selectedIds.has(p.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(new Set(filtered.map((p: any) => p.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Stoc</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} className={cn("group", selectedIds.has(p.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(p.id); else next.delete(p.id);
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded border border-border" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-foreground">{p.name}</p>
                          <div className="flex gap-1 mt-0.5">
                            {p.featured && <Badge variant="secondary" className="text-xs">Recomandat</Badge>}
                            {(p.images?.length || 0) > 0 && <Badge variant="outline" className="text-xs">{p.images.length} foto</Badge>}
                            {p.specs?._variants?.length > 0 && <Badge variant="outline" className="text-xs"><Layers className="w-3 h-3 mr-1" />{p.specs._variants.length} var.</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.categories?.name || "—"}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">{Number(p.price).toFixed(2)} RON</span>
                      {p.old_price && <span className="text-xs text-muted-foreground line-through ml-2">{Number(p.old_price).toFixed(2)}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.stock > 10 ? "default" : p.stock > 0 ? "secondary" : "destructive"}>
                        {p.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.brand || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewOpen(p)} title="Preview">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Editează">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          const dup = { ...emptyForm, name: p.name + " (copie)", slug: generateSlug(p.name + " copie"), price: p.price, old_price: p.old_price, stock: p.stock, description: p.description || "", brand: p.brand || "", image_url: p.image_url || "", images: p.images || [], category_id: p.category_id };
                          setForm(dup);
                          setEditingId(null);
                          setStep(0);
                          setDialogOpen(true);
                          toast.info("Produs duplicat — editează și salvează");
                        }} title="Duplică">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p.id)} title="Șterge">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Niciun produs găsit.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Product Wizard Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingId(null); setForm(emptyForm); setStep(0); setVariants([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editează Produs" : "Produs Nou"}</DialogTitle>
            <DialogDescription>Pasul {step + 1} din {STEPS.length}: {STEPS[step].label}</DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  i === step ? "bg-primary text-primary-foreground" :
                  i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-3 h-3" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Înapoi
            </Button>
            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-1">
                  Continuă <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-1">
                  {saveMutation.isPending ? "Se salvează..." : editingId ? "Actualizează" : "Creează produs"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi acest produs? Acțiunea este ireversibilă.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Renunță</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Preview */}
      <Dialog open={!!previewOpen} onOpenChange={(open) => !open && setPreviewOpen(null)}>
        <DialogContent className="max-w-lg">
          {previewOpen && (
            <>
              <DialogHeader>
                <DialogTitle>{previewOpen.name}</DialogTitle>
                <DialogDescription>{previewOpen.brand || "Fără brand"} • {previewOpen.categories?.name || "Fără categorie"}</DialogDescription>
              </DialogHeader>
              {previewOpen.image_url && (
                <img src={previewOpen.image_url} alt={previewOpen.name} className="w-full h-48 object-cover rounded-lg border border-border" />
              )}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Preț</p>
                  <p className="font-bold text-foreground">{Number(previewOpen.price).toFixed(2)} RON</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Stoc</p>
                  <p className="font-bold text-foreground">{previewOpen.stock}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Galerie</p>
                  <p className="font-bold text-foreground">{previewOpen.images?.length || 0} foto</p>
                </div>
              </div>
              {previewOpen.description && (
                <p className="text-sm text-muted-foreground line-clamp-4">{previewOpen.description}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setPreviewOpen(null); openEdit(previewOpen); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editează
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
