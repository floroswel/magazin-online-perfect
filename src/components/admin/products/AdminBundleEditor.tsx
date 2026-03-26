import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Package, Plus, Trash2, Save, Search, GripVertical,
  ShoppingCart, ArrowLeft, Loader2, ImageIcon, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface BundleComponent {
  id?: string;
  product_id: string;
  quantity: number;
  sort_order: number;
  product?: { id: string; name: string; price: number; image_url: string | null; stock: number };
}

interface BundleForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price_type: string;
  price_value: number;
  category_id: string;
  status: string;
  availability_rule: string;
  order_display_mode: string;
  image_url: string;
  meta_title: string;
  meta_description: string;
}

const EMPTY_FORM: BundleForm = {
  name: "", slug: "", description: "", short_description: "",
  price_type: "fixed", price_value: 0, category_id: "",
  status: "active", availability_rule: "all_available",
  order_display_mode: "bundle_zero", image_url: "",
  meta_title: "", meta_description: "",
};

export default function AdminBundleEditor({ bundleId, onBack }: { bundleId?: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BundleForm>(EMPTY_FORM);
  const [components, setComponents] = useState<BundleComponent[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const isEditing = !!bundleId;

  // Fetch bundle data if editing
  const { data: bundleData } = useQuery({
    queryKey: ["bundle-detail", bundleId],
    queryFn: async () => {
      if (!bundleId) return null;
      const { data } = await supabase
        .from("bundle_products" as any)
        .select("*")
        .eq("id", bundleId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!bundleId,
  });

  const { data: bundleComponents = [] } = useQuery({
    queryKey: ["bundle-components", bundleId],
    queryFn: async () => {
      if (!bundleId) return [];
      const { data } = await supabase
        .from("bundle_components" as any)
        .select("*, product:products(id, name, price, image_url, stock)")
        .eq("bundle_id", bundleId)
        .order("sort_order");
      return (data as any[]) || [];
    },
    enabled: !!bundleId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-bundle", productSearch],
    queryFn: async () => {
      let q = supabase.from("products").select("id, name, price, image_url, stock").order("name").limit(50);
      if (productSearch) q = q.ilike("name", `%${productSearch}%`);
      const { data } = await q;
      return (data as any[]) || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["bundle-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("bundle_settings" as any).select("*").limit(1).maybeSingle();
      return data as any;
    },
  });

  useEffect(() => {
    if (bundleData) {
      setForm({
        id: bundleData.id,
        name: bundleData.name || "",
        slug: bundleData.slug || "",
        description: bundleData.description || "",
        short_description: bundleData.short_description || "",
        price_type: bundleData.price_type || "fixed",
        price_value: bundleData.price_value || 0,
        category_id: bundleData.category_id || "",
        status: bundleData.status || "active",
        availability_rule: bundleData.availability_rule || settings?.default_availability_rule || "all_available",
        order_display_mode: bundleData.order_display_mode || settings?.default_order_display_mode || "bundle_zero",
        image_url: bundleData.image_url || "",
        meta_title: bundleData.meta_title || "",
        meta_description: bundleData.meta_description || "",
      });
    }
  }, [bundleData, settings]);

  useEffect(() => {
    if (bundleComponents.length > 0) {
      setComponents(bundleComponents.map((c: any) => ({
        id: c.id,
        product_id: c.product_id,
        quantity: c.quantity,
        sort_order: c.sort_order,
        product: c.product,
      })));
    }
  }, [bundleComponents]);

  const originalTotal = useMemo(() => {
    return components.reduce((sum, c) => sum + (c.product?.price || 0) * c.quantity, 0);
  }, [components]);

  const bundlePrice = useMemo(() => {
    if (form.price_type === "fixed") return form.price_value;
    return originalTotal * (form.price_value / 100);
  }, [form.price_type, form.price_value, originalTotal]);

  const discount = originalTotal > 0 ? Math.round((1 - bundlePrice / originalTotal) * 100) : 0;

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const addComponent = (product: any) => {
    // Prevent adding bundles as components
    if (components.find((c) => c.product_id === product.id)) {
      toast.error("Produsul este deja în pachet");
      return;
    }
    setComponents((prev) => [
      ...prev,
      {
        product_id: product.id,
        quantity: 1,
        sort_order: prev.length,
        product: product,
      },
    ]);
    setShowAddProduct(false);
    setProductSearch("");
  };

  const removeComponent = (idx: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateComponentQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    setComponents((prev) => prev.map((c, i) => (i === idx ? { ...c, quantity: qty } : c)));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const bundlePayload: any = {
        name: form.name,
        slug,
        description: form.description || null,
        short_description: form.short_description || null,
        price_type: form.price_type,
        price_value: form.price_value,
        original_total_value: originalTotal,
        category_id: form.category_id || null,
        status: form.status,
        availability_rule: form.availability_rule,
        order_display_mode: form.order_display_mode,
        image_url: form.image_url || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        updated_at: new Date().toISOString(),
      };

      let bid: string;
      if (isEditing && bundleId) {
        const { error } = await supabase.from("bundle_products" as any).update(bundlePayload).eq("id", bundleId);
        if (error) throw error;
        bid = bundleId;
      } else {
        const { data, error } = await supabase.from("bundle_products" as any).insert(bundlePayload).select("id").single();
        if (error) throw error;
        bid = (data as any).id;
      }

      // Sync components
      await supabase.from("bundle_components" as any).delete().eq("bundle_id", bid);
      if (components.length > 0) {
        const rows = components.map((c, i) => ({
          bundle_id: bid,
          product_id: c.product_id,
          quantity: c.quantity,
          sort_order: i,
        }));
        const { error } = await supabase.from("bundle_components" as any).insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast.success(isEditing ? "Pachet actualizat!" : "Pachet creat!");
      onBack();
    },
    onError: (e) => toast.error(e.message),
  });

  // Check component availability
  const unavailableComponents = components.filter((c) => c.product && c.product.stock <= 0);
  const allAvailable = unavailableComponents.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {isEditing ? "Editare Pachet" : "Creare Pachet Nou"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? form.name : "Configurează pachetul de produse"}
            </p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {isEditing ? "Actualizează" : "Creează Pachet"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column — info + components */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Informații Pachet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nume pachet *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Pachet Gaming Complet" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="pachet-gaming-complet" />
              </div>
              <div>
                <Label>Descriere scurtă</Label>
                <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Descriere completă</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Imagine pachet (URL)</Label>
                  <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Categorie</Label>
                  <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fără categorie</SelectItem>
                      {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Produse Componente ({components.length})
                </CardTitle>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă produs</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adaugă produs în pachet</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Caută produse..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-9" />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {products.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => addComponent(p)}
                          >
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.price} RON · Stoc: {p.stock}</p>
                            </div>
                            <Plus className="w-4 h-4 text-primary shrink-0" />
                          </div>
                        ))}
                        {products.length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">Niciun produs găsit</p>}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {components.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Niciun produs adăugat. Adaugă produse componente în pachet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Produs</TableHead>
                      <TableHead className="w-24">Preț unit.</TableHead>
                      <TableHead className="w-20">Cant.</TableHead>
                      <TableHead className="w-24">Subtotal</TableHead>
                      <TableHead className="w-16">Stoc</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map((c, idx) => (
                      <TableRow key={c.product_id + idx}>
                        <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden">
                              {c.product?.image_url ? <img src={c.product.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3 h-3 text-muted-foreground m-auto mt-2" />}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[200px]">{c.product?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.product?.price} RON</TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={c.quantity} onChange={(e) => updateComponentQty(idx, +e.target.value)} className="w-16 h-8 text-sm" />
                        </TableCell>
                        <TableCell className="text-sm font-medium">{((c.product?.price || 0) * c.quantity).toFixed(2)} RON</TableCell>
                        <TableCell>
                          <Badge variant={c.product && c.product.stock > 0 ? "default" : "destructive"} className="text-xs">
                            {c.product?.stock || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeComponent(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {components.length > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valoare totală componente:</span>
                  <span className="text-lg font-bold text-foreground">{originalTotal.toFixed(2)} RON</span>
                </div>
              )}

              {!allAvailable && form.availability_rule === "all_available" && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Atenție:</strong> {unavailableComponents.length} produs(e) component(e) sunt indisponibile.
                    Cu regula curentă, pachetul NU va putea fi comandat.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between">
                  <Label>Meta Title</Label>
                  <span className="text-xs text-muted-foreground">{(form.meta_title || "").length}/70</span>
                </div>
                <Input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} maxLength={70} placeholder="Titlu SEO pachet" />
              </div>
              <div>
                <div className="flex justify-between">
                  <Label>Meta Description</Label>
                  <span className="text-xs text-muted-foreground">{(form.meta_description || "").length}/160</span>
                </div>
                <Textarea value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} maxLength={160} rows={2} placeholder="Descriere SEO pachet" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — pricing + settings */}
        <div className="space-y-5">
          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Preț Pachet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tip preț</Label>
                <Select value={form.price_type} onValueChange={(v) => set("price_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Preț fix</SelectItem>
                    <SelectItem value="percentage">Procentual din total componente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.price_type === "fixed" ? (
                <div>
                  <Label>Preț pachet (RON)</Label>
                  <Input type="number" value={form.price_value} onChange={(e) => set("price_value", +e.target.value)} />
                </div>
              ) : (
                <div>
                  <Label>Procent din totalul componentelor (%)</Label>
                  <Input type="number" value={form.price_value} onChange={(e) => set("price_value", +e.target.value)} placeholder="80" />
                  <p className="text-xs text-muted-foreground mt-1">Ex: 80% = discount 20% din totalul componentelor</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total componente:</span>
                  <span className="line-through text-muted-foreground">{originalTotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span className="text-foreground">Preț pachet:</span>
                  <span className="text-primary">{bundlePrice.toFixed(2)} RON</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Economisești:</span>
                    <Badge className="bg-green-500/15 text-green-500 border-green-500/30">-{discount}%</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="inactive">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Availability Rule */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate Pachet</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.availability_rule}
                onValueChange={(v) => set("availability_rule", v)}
                className="space-y-3"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="regardless" id="b-regardless" className="mt-1" />
                  <Label htmlFor="b-regardless" className="text-xs cursor-pointer">
                    Indiferent de disponibilitatea componentelor
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="all_available" id="b-all" className="mt-1" />
                  <Label htmlFor="b-all" className="text-xs cursor-pointer">
                    Doar dacă toate componentele sunt disponibile
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Display Mode */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Afișare în Comenzi</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.order_display_mode}
                onValueChange={(v) => set("order_display_mode", v)}
                className="space-y-3"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="bundle_zero" id="d-bundle" className="mt-1" />
                  <Label htmlFor="d-bundle" className="text-xs cursor-pointer">
                    Pachet cu preț + componente la 0 RON
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="components_adjusted" id="d-comp" className="mt-1" />
                  <Label htmlFor="d-comp" className="text-xs cursor-pointer">
                    Doar componente cu preț ajustat proporțional
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
