import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Layers, Plus, Edit, Trash2, Search, Save, Loader2,
  Settings, AlertTriangle, X, ImageIcon, Package,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ───── module enabled check ─────
function useModuleEnabled() {
  return useQuery({
    queryKey: ["product-lines-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "product_lines_enabled")
        .maybeSingle();
      return data?.value_json === true;
    },
  });
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function AdminProductLines() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading: loadingEnabled } = useModuleEnabled();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ["admin-product-lines"],
    queryFn: async () => {
      const { data: pls } = await supabase
        .from("product_lines" as any)
        .select("*, grouping_attribute:product_attributes(id, name)")
        .order("created_at", { ascending: false });
      if (!pls) return [];
      const ids = (pls as any[]).map((p: any) => p.id);
      const { data: items } = await supabase
        .from("product_line_items" as any)
        .select("product_line_id")
        .in("product_line_id", ids.length ? ids : ["__none__"]);
      return (pls as any[]).map((p: any) => ({
        ...p,
        product_count: (items as any[] || []).filter((i: any) => i.product_line_id === p.id).length,
      }));
    },
    enabled: enabled === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_lines" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-lines"] });
      toast.success("Linia de produse a fost ștearsă!");
    },
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (loadingEnabled) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  if (!enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Linii de Produse Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Activează modulul din Setări → Linii de Produse pentru a folosi această funcție.
          </p>
          <Link to="/admin/settings/product-lines">
            <Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări Linii de Produse</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (detailId) {
    return (
      <ProductLineDetail
        lineId={detailId}
        onBack={() => {
          setDetailId(null);
          queryClient.invalidateQueries({ queryKey: ["admin-product-lines"] });
        }}
      />
    );
  }

  const filtered = searchTerm
    ? lines.filter((l: any) => l.internal_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Linii de Produse
          </h1>
          <p className="text-sm text-muted-foreground">Grupează produse similare pentru navigare rapidă în magazin</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings/product-lines">
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" /> Setări</Button>
          </Link>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă linie de produse
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{lines.length}</p><p className="text-xs text-muted-foreground">Total linii</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{lines.reduce((s: number, l: any) => s + (l.product_count || 0), 0)}</p><p className="text-xs text-muted-foreground">Total produse grupate</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{lines.filter((l: any) => l.product_count >= 2).length}</p><p className="text-xs text-muted-foreground">Linii active în magazin (2+ produse)</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută după denumire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate liniile de produse</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denumire internă</TableHead>
                <TableHead>Atribut de grupare</TableHead>
                <TableHead>Descriere</TableHead>
                <TableHead>#Produse</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nicio linie de produse creată.</TableCell></TableRow>
              ) : filtered.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <span className="font-medium text-sm">{line.internal_name}</span>
                    {!line.grouping_attribute && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> Atribut lipsă
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {line.grouping_attribute ? (
                      <Badge variant="outline" className="text-xs">{line.grouping_attribute.name}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {line.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setDetailId(line.id)}>
                      {line.product_count} produse
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(line.id)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(line.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      {(showCreate || editId) && (
        <ProductLineFormDialog
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
          onSaved={() => {
            setShowCreate(false);
            setEditId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-product-lines"] });
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmare ștergere</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ștergerea liniei va elimina gruparea din magazin. <strong>Produsele nu vor fi șterse.</strong>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anulează</Button>
            <Button variant="destructive" onClick={() => { deleteMutation.mutate(deleteConfirm!); setDeleteConfirm(null); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Șterge linia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CREATE / EDIT FORM DIALOG
// ═══════════════════════════════════════════════
function ProductLineFormDialog({ editId, onClose, onSaved }: { editId: string | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAttrWarning, setShowAttrWarning] = useState(false);

  const { data: attributes = [] } = useQuery({
    queryKey: ["product-attributes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("product_attributes").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["product-line-edit", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data } = await supabase.from("product_lines" as any).select("*").eq("id", editId).maybeSingle();
      return data as any;
    },
    enabled: !!editId,
  });

  const [loaded, setLoaded] = useState(false);
  if (existing && !loaded) {
    setName(existing.internal_name || "");
    setDescription(existing.description || "");
    setAttributeId(existing.grouping_attribute_id || "");
    setLoaded(true);
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Denumirea este obligatorie"); return; }
    if (!attributeId) { toast.error("Selectează atributul de grupare"); return; }

    // If editing and attribute changed, show warning
    if (editId && existing?.grouping_attribute_id && existing.grouping_attribute_id !== attributeId && !showAttrWarning) {
      setShowAttrWarning(true);
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        internal_name: name.trim(),
        description: description.trim() || null,
        grouping_attribute_id: attributeId || null,
        updated_at: new Date().toISOString(),
      };

      if (editId) {
        const { error } = await supabase.from("product_lines" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_lines" as any).insert(payload);
        if (error) throw error;
      }

      toast.success(editId ? "Linia actualizată!" : "Linia creată!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
      setShowAttrWarning(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editId ? "Editare linie de produse" : "Adaugă linie de produse"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Denumire internă *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Geci Nike Iarnă" />
            <p className="text-xs text-muted-foreground mt-1">Vizibilă doar în admin, nu în magazin</p>
          </div>
          <div>
            <Label>Descriere (vizibilă în magazin)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Opțional — afișată pe pagina produsului" />
          </div>
          <div>
            <Label>Atribut de grupare *</Label>
            <Select value={attributeId} onValueChange={setAttributeId}>
              <SelectTrigger><SelectValue placeholder="Selectează atributul" /></SelectTrigger>
              <SelectContent>
                {attributes.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Determină cum sunt grupate și afișate produsele (ex: Culoare → swatches colorate)
            </p>
          </div>

          {showAttrWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Atenție:</strong> Schimbarea atributului de grupare poate afecta afișarea în magazin.
                Trebuie să verifici că toate produsele din linie au noul atribut setat corect.
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAttrWarning(false)}>Anulează</Button>
                  <Button size="sm" onClick={handleSave}>Continuă și salvează</Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {!showAttrWarning && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Anulează</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              {editId ? "Actualizează" : "Creează"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// PRODUCT LINE DETAIL (products list + add/remove)
// ═══════════════════════════════════════════════
function ProductLineDetail({ lineId, onBack }: { lineId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const { data: line } = useQuery({
    queryKey: ["product-line-meta", lineId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_lines" as any)
        .select("*, grouping_attribute:product_attributes(id, name)")
        .eq("id", lineId)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["product-line-items", lineId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_line_items" as any)
        .select("*, product:products(id, name, slug, price, image_url, stock, sku, status)")
        .eq("product_line_id", lineId)
        .order("created_at");
      return (data as any[]) || [];
    },
  });

  // Get attribute values for products in this line
  const { data: attrValues = [] } = useQuery({
    queryKey: ["product-line-attr-values", lineId, line?.grouping_attribute_id],
    queryFn: async () => {
      if (!line?.grouping_attribute_id || items.length === 0) return [];
      const productIds = items.map((i: any) => i.product_id);
      // Try to find attribute values assigned to these products
      // This depends on how product-attribute values are stored; check variant_attributes or similar
      return [];
    },
    enabled: !!line?.grouping_attribute_id && items.length > 0,
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["products-for-line", addSearch],
    queryFn: async () => {
      if (!addSearch || addSearch.length < 2) return [];
      const { data } = await supabase.from("products")
        .select("id, name, price, sku, image_url, stock")
        .or(`name.ilike.%${addSearch}%,sku.ilike.%${addSearch}%`)
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: addSearch.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("product_line_items" as any).insert({
        product_line_id: lineId,
        product_id: productId,
      } as any);
      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          throw new Error("Produsul aparține deja unei linii de produse. Un produs poate fi într-o singură linie.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-line-items", lineId] });
      toast.success("Produs adăugat în linie!");
      setShowAddProduct(false);
      setAddSearch("");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("product_line_items" as any).delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-line-items", lineId] });
      toast.success("Produs eliminat din linie!");
    },
  });

  const existingProductIds = new Set(items.map((i: any) => i.product_id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><X className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {line?.internal_name || "..."}
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} produse · Grupat după: {line?.grouping_attribute?.name || "—"}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAddProduct(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă produs
        </Button>
      </div>

      {line?.description && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{line.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preț</TableHead>
                <TableHead>Stoc</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Niciun produs în linie. Adaugă produse pentru a crea gruparea.
                </TableCell></TableRow>
              ) : items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[220px]">{item.product?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.product?.sku || "—"}</TableCell>
                  <TableCell className="text-sm">{item.product?.price} RON</TableCell>
                  <TableCell>
                    <Badge variant={item.product?.stock > 0 ? "default" : "destructive"} className="text-xs">
                      {item.product?.stock ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.product?.status === "active" ? "default" : "secondary"} className="text-xs">
                      {item.product?.status === "active" ? "Activ" : "Inactiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeMutation.mutate(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adaugă produs în linie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume sau SKU..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {searchProducts.map((p: any) => {
                const alreadyAdded = existingProductIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2 rounded transition-colors ${
                      alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
                    }`}
                    onClick={() => !alreadyAdded && addMutation.mutate(p.id)}
                  >
                    <div className="w-9 h-9 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price} RON {p.sku ? `· ${p.sku}` : ""} · Stoc: {p.stock}</p>
                    </div>
                    {alreadyAdded ? (
                      <Badge variant="secondary" className="text-xs shrink-0">În linie</Badge>
                    ) : (
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
              {addSearch.length >= 2 && searchProducts.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Niciun produs găsit</p>
              )}
              {addSearch.length < 2 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Tastează minim 2 caractere pentru căutare</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
