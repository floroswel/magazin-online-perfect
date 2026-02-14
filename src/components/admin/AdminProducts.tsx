import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

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
}

const emptyForm: ProductForm = {
  name: "", slug: "", price: 0, old_price: null, stock: 0,
  description: "", brand: "", image_url: "", images: [], featured: false, category_id: null,
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      toast.error("Eroare la încărcare: " + err.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} imagini încărcate!`);
    } catch (err: any) {
      toast.error("Eroare la încărcare: " + err.message);
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const saveMutation = useMutation({
    mutationFn: async (product: ProductForm & { id?: string }) => {
      const payload = {
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
      toast.success("Produs șters!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (product: any) => {
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
    });
    setDialogOpen(true);
  };

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Produse ({products.length})</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută produse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) { setEditingId(null); setForm(emptyForm); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editează Produs" : "Produs Nou"}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate({ ...form, id: editingId || undefined });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nume</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setForm((f) => ({
                            ...f,
                            name,
                            slug: !editingId ? generateSlug(name) : f.slug,
                          }));
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Preț (RON)</Label>
                      <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Preț vechi</Label>
                      <Input type="number" step="0.01" value={form.old_price ?? ""} onChange={(e) => setForm({ ...form, old_price: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stoc</Label>
                      <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Categorie</Label>
                      <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                        <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Fără categorie</SelectItem>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Main Image Upload */}
                  <div className="space-y-2">
                    <Label>Imagine principală</Label>
                    <div className="flex gap-3 items-start">
                      {form.image_url ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: "" })}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Upload className="w-4 h-4 mr-1" /> {uploading ? "Se încarcă..." : "Încarcă imagine"}
                        </Button>
                        <p className="text-xs text-muted-foreground">sau introdu URL-ul manual:</p>
                        <Input
                          value={form.image_url}
                          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                          placeholder="https://..."
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="space-y-2">
                    <Label>Galerie imagini</Label>
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploading}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                      >
                        <Plus className="w-5 h-5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">Adaugă</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descriere</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} id="featured" />
                    <Label htmlFor="featured">Produs recomandat</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Se salvează..." : "Salvează"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <div className="flex gap-1 mt-0.5">
                            {p.featured && <Badge variant="secondary" className="text-xs">Recomandat</Badge>}
                            {(p.images?.length || 0) > 0 && (
                              <Badge variant="outline" className="text-xs">{p.images.length} foto</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.categories?.name || "—"}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{Number(p.price).toFixed(2)} RON</span>
                      {p.old_price && (
                        <span className="text-xs text-muted-foreground line-through ml-2">{Number(p.old_price).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.stock > 10 ? "default" : p.stock > 0 ? "secondary" : "destructive"}>
                        {p.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.brand || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Sigur vrei să ștergi acest produs?")) deleteMutation.mutate(p.id);
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Niciun produs găsit.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
