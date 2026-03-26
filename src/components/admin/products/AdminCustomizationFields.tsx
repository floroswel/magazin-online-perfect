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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  FormInput, Plus, Edit, Trash2, Search, Save, Loader2,
  Settings, X, Package, FileText, Image, Hash, ToggleLeft,
  List, Upload, Type, AlignLeft, Code, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type, color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { value: "long_text", label: "Long Text", icon: AlignLeft, color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { value: "html", label: "HTML", icon: Code, color: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
  { value: "numeric", label: "Numeric", icon: Hash, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "float", label: "Float", icon: Hash, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "boolean", label: "Boolean", icon: ToggleLeft, color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "lista", label: "Lista", icon: List, color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" },
  { value: "fisier", label: "Fișier", icon: FileText, color: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  { value: "imagine", label: "Imagine", icon: Image, color: "bg-pink-500/15 text-pink-600 border-pink-500/30" },
  { value: "lista_fisiere", label: "Lista fișiere", icon: Layers, color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" },
  { value: "product_picker", label: "Product Picker", icon: Package, color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  { value: "product_multipicker", label: "Product Multipicker", icon: Package, color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
] as const;

function getFieldTypeMeta(type: string) {
  return FIELD_TYPES.find((t) => t.value === type) || FIELD_TYPES[0];
}

function useModuleEnabled() {
  return useQuery({
    queryKey: ["customization-fields-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "customization_fields_enabled")
        .maybeSingle();
      return data?.value_json === true;
    },
  });
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function AdminCustomizationFields() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading: loadingEnabled } = useModuleEnabled();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; count: number } | null>(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["admin-customization-fields"],
    queryFn: async () => {
      const { data: cfs } = await supabase
        .from("customization_fields" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (!cfs) return [];
      const ids = (cfs as any[]).map((f: any) => f.id);
      const { data: junctions } = await supabase
        .from("customization_field_products" as any)
        .select("field_id")
        .in("field_id", ids.length ? ids : ["__none__"]);
      return (cfs as any[]).map((f: any) => ({
        ...f,
        product_count: (junctions as any[] || []).filter((j: any) => j.field_id === f.id).length,
      }));
    },
    enabled: enabled === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customization_fields" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customization-fields"] });
      toast.success("Câmpul de personalizare a fost șters!");
    },
  });

  if (loadingEnabled) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  if (!enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <FormInput className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Personalizare Comandă Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Activează modulul din Setări → Personalizare Comandă pentru a folosi această funcție.
          </p>
          <Link to="/admin/settings/customization">
            <Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări Personalizare</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (detailId) {
    return (
      <FieldProductsDetail
        fieldId={detailId}
        onBack={() => {
          setDetailId(null);
          queryClient.invalidateQueries({ queryKey: ["admin-customization-fields"] });
        }}
      />
    );
  }

  const filtered = searchTerm
    ? fields.filter((f: any) =>
        f.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.internal_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : fields;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FormInput className="w-5 h-5 text-primary" /> Câmpuri Personalizare Comandă
          </h1>
          <p className="text-sm text-muted-foreground">Permite clienților să adauge conținut personalizat la produse</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings/customization">
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" /> Setări</Button>
          </Link>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă câmp personalizare
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{fields.length}</p><p className="text-xs text-muted-foreground">Total câmpuri</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{fields.filter((f: any) => f.is_required).length}</p><p className="text-xs text-muted-foreground">Câmpuri obligatorii</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{fields.reduce((s: number, f: any) => s + (f.product_count || 0), 0)}</p><p className="text-xs text-muted-foreground">Total asocieri produse</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută după denumire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate câmpurile de personalizare</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denumire câmp</TableHead>
                <TableHead>Denumire internă</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Obligatoriu</TableHead>
                <TableHead>Locație</TableHead>
                <TableHead>#Produse</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Niciun câmp de personalizare creat.</TableCell></TableRow>
              ) : filtered.map((field: any) => {
                const meta = getFieldTypeMeta(field.field_type);
                return (
                  <TableRow key={field.id}>
                    <TableCell><span className="font-medium text-sm">{field.display_name}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground font-mono">{field.internal_name}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={field.is_required ? "default" : "secondary"} className="text-xs">
                        {field.is_required ? "Da" : "Nu"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {field.location === "checkout" ? "Checkout" : "Pagina produs"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setDetailId(field.id)}>
                        {field.product_count} produse
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(field.id)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ id: field.id, name: field.display_name, count: field.product_count })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      {(showCreate || editId) && (
        <FieldFormDialog
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
          onSaved={() => {
            setShowCreate(false);
            setEditId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-customization-fields"] });
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmare ștergere</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Acest câmp (<strong>{deleteConfirm?.name}</strong>) este asociat pe <strong>{deleteConfirm?.count || 0} produse</strong>.
            Ștergerea îl va elimina de pe toate. Valorile din comenzi existente vor fi păstrate.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anulează</Button>
            <Button variant="destructive" onClick={() => { deleteMutation.mutate(deleteConfirm!.id); setDeleteConfirm(null); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Șterge câmpul
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
function FieldFormDialog({ editId, onClose, onSaved }: { editId: string | null; onClose: () => void; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [internalName, setInternalName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [hintText, setHintText] = useState("");
  const [location, setLocation] = useState("product_page");
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [listOptions, setListOptions] = useState<{ label: string; price?: number }[]>([]);

  const { data: existing } = useQuery({
    queryKey: ["customization-field-edit", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data } = await supabase.from("customization_fields" as any).select("*").eq("id", editId).maybeSingle();
      return data as any;
    },
    enabled: !!editId,
  });

  const [loaded, setLoaded] = useState(false);
  if (existing && !loaded) {
    setDisplayName(existing.display_name || "");
    setInternalName(existing.internal_name || "");
    setFieldType(existing.field_type || "text");
    setIsRequired(existing.is_required || false);
    setHintText(existing.hint_text || "");
    setLocation(existing.location || "product_page");
    const s = existing.settings || {};
    setSettings(s);
    if (s.list_options) setListOptions(s.list_options);
    setLoaded(true);
  }

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error("Denumirea câmpului este obligatorie"); return; }
    if (!internalName.trim()) { toast.error("Denumirea internă este obligatorie"); return; }

    setSaving(true);
    try {
      const finalSettings = { ...settings };
      if (fieldType === "lista" || fieldType === "lista_fisiere") {
        finalSettings.list_options = listOptions;
      }

      const payload: any = {
        display_name: displayName.trim(),
        internal_name: internalName.trim(),
        field_type: fieldType,
        is_required: isRequired,
        hint_text: hintText.trim() || null,
        location,
        settings: finalSettings,
        updated_at: new Date().toISOString(),
      };

      if (editId) {
        // Don't allow changing field type on edit
        delete payload.field_type;
        const { error } = await supabase.from("customization_fields" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customization_fields" as any).insert(payload);
        if (error) throw error;
      }

      toast.success(editId ? "Câmpul actualizat!" : "Câmpul creat!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => setSettings((prev: any) => ({ ...prev, [key]: value }));

  const addListOption = () => setListOptions((prev) => [...prev, { label: "", price: undefined }]);
  const removeListOption = (idx: number) => setListOptions((prev) => prev.filter((_, i) => i !== idx));
  const updateListOption = (idx: number, key: string, value: any) =>
    setListOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [key]: value } : o)));

  const showTextSettings = fieldType === "text" || fieldType === "long_text";
  const showNumericSettings = fieldType === "numeric" || fieldType === "float";
  const showFileSettings = fieldType === "fisier" || fieldType === "imagine";
  const showListSettings = fieldType === "lista" || fieldType === "lista_fisiere";
  const showBoolSettings = fieldType === "boolean";
  const isCheckoutOnly = fieldType === "product_picker" || fieldType === "product_multipicker";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Editare câmp personalizare" : "Adaugă câmp personalizare"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Denumire câmp (vizibilă în magazin) *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex: Text personalizat" />
            </div>
            <div>
              <Label>Denumire internă *</Label>
              <Input value={internalName} onChange={(e) => setInternalName(e.target.value)} placeholder="Ex: custom_text_engraving" />
              <p className="text-xs text-muted-foreground mt-1">Doar pentru admin/API</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tip câmp *</Label>
              {editId ? (
                <div>
                  <Badge variant="outline" className={`text-sm ${getFieldTypeMeta(fieldType).color}`}>
                    {getFieldTypeMeta(fieldType).label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Tipul nu poate fi schimbat după creare</p>
                </div>
              ) : (
                <Select value={fieldType} onValueChange={(v) => { setFieldType(v); if (v === "product_picker" || v === "product_multipicker") setLocation("checkout"); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Locație afișare</Label>
              <Select value={isCheckoutOnly ? "checkout" : location} onValueChange={setLocation} disabled={isCheckoutOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_page">Pagina produs</SelectItem>
                  <SelectItem value="checkout">Checkout</SelectItem>
                </SelectContent>
              </Select>
              {isCheckoutOnly && <p className="text-xs text-muted-foreground mt-1">Acest tip este disponibil doar la checkout</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Obligatoriu</Label>
              <p className="text-xs text-muted-foreground">Clientul trebuie să completeze înainte de Add to Cart</p>
            </div>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          <div>
            <Label>Hint client (opțional)</Label>
            <Textarea value={hintText} onChange={(e) => setHintText(e.target.value)} rows={2} placeholder="Ex: Încarcă fotografia în format JPG sau PNG, minim 300 DPI" />
          </div>

          <Separator />

          {/* Type-specific settings */}
          <h3 className="text-sm font-semibold text-foreground">Setări specifice tipului</h3>

          {showTextSettings && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min caractere</Label>
                <Input type="number" value={settings.min_chars || ""} onChange={(e) => updateSetting("min_chars", e.target.value ? Number(e.target.value) : null)} placeholder="Opțional" />
              </div>
              <div>
                <Label>Max caractere</Label>
                <Input type="number" value={settings.max_chars || ""} onChange={(e) => updateSetting("max_chars", e.target.value ? Number(e.target.value) : null)} placeholder="Opțional" />
              </div>
            </div>
          )}

          {showNumericSettings && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valoare minimă</Label>
                <Input type="number" value={settings.min_value ?? ""} onChange={(e) => updateSetting("min_value", e.target.value ? Number(e.target.value) : null)} placeholder="Opțional" />
              </div>
              <div>
                <Label>Valoare maximă</Label>
                <Input type="number" value={settings.max_value ?? ""} onChange={(e) => updateSetting("max_value", e.target.value ? Number(e.target.value) : null)} placeholder="Opțional" />
              </div>
            </div>
          )}

          {showBoolSettings && (
            <div className="flex items-center gap-2">
              <Label>Valoare implicită (bifat)</Label>
              <Switch checked={settings.default_value || false} onCheckedChange={(v) => updateSetting("default_value", v)} />
            </div>
          )}

          {showFileSettings && (
            <div className="space-y-3">
              <div>
                <Label>Extensii acceptate</Label>
                <Input
                  value={settings.accepted_extensions || ""}
                  onChange={(e) => updateSetting("accepted_extensions", e.target.value)}
                  placeholder={fieldType === "imagine" ? "jpg, jpeg, png, gif, webp, svg" : "jpg, png, pdf, doc, docx, zip"}
                />
                <p className="text-xs text-muted-foreground mt-1">Separate prin virgulă</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max dimensiune fișier (MB)</Label>
                  <Input type="number" value={settings.max_file_size || 10} onChange={(e) => updateSetting("max_file_size", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Max număr fișiere</Label>
                  <Input type="number" value={settings.max_files || 1} onChange={(e) => updateSetting("max_files", Number(e.target.value))} min={1} />
                </div>
              </div>
            </div>
          )}

          {showListSettings && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opțiuni listă</Label>
                <Button type="button" size="sm" variant="outline" onClick={addListOption}>
                  <Plus className="w-3 h-3 mr-1" /> Adaugă opțiune
                </Button>
              </div>
              {listOptions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">Nicio opțiune adăugată</p>
              )}
              {listOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={(e) => updateListOption(idx, "label", e.target.value)}
                    placeholder="Denumire opțiune"
                    className="flex-1"
                  />
                  {fieldType === "lista" && (
                    <Input
                      type="number"
                      value={opt.price ?? ""}
                      onChange={(e) => updateListOption(idx, "price", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="+RON"
                      className="w-24"
                    />
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeListOption(idx)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!showTextSettings && !showNumericSettings && !showFileSettings && !showListSettings && !showBoolSettings && (
            <p className="text-sm text-muted-foreground">Nicio setare suplimentară pentru acest tip de câmp.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {editId ? "Actualizează" : "Creează"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// FIELD PRODUCTS DETAIL (assign/remove products)
// ═══════════════════════════════════════════════
function FieldProductsDetail({ fieldId, onBack }: { fieldId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const { data: field } = useQuery({
    queryKey: ["customization-field-meta", fieldId],
    queryFn: async () => {
      const { data } = await supabase.from("customization_fields" as any).select("*").eq("id", fieldId).maybeSingle();
      return data as any;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["customization-field-products", fieldId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customization_field_products" as any)
        .select("*, product:products(id, name, slug, price, image_url, sku, status)")
        .eq("field_id", fieldId)
        .order("sort_order");
      return (data as any[]) || [];
    },
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["products-for-customization", addSearch],
    queryFn: async () => {
      if (!addSearch || addSearch.length < 2) return [];
      const { data } = await supabase.from("products")
        .select("id, name, price, sku, image_url")
        .or(`name.ilike.%${addSearch}%,sku.ilike.%${addSearch}%`)
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: addSearch.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const maxSort = items.length;
      const { error } = await supabase.from("customization_field_products" as any).insert({
        field_id: fieldId,
        product_id: productId,
        sort_order: maxSort,
      } as any);
      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          throw new Error("Acest câmp este deja asociat pe acest produs.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customization-field-products", fieldId] });
      toast.success("Produs asociat!");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("customization_field_products" as any).delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customization-field-products", fieldId] });
      toast.success("Asociere eliminată!");
    },
  });

  const existingIds = new Set(items.map((i: any) => i.product_id));
  const meta = field ? getFieldTypeMeta(field.field_type) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><X className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FormInput className="w-5 h-5 text-primary" />
              {field?.display_name || "..."}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{field?.internal_name}</span>
              {meta && <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>}
              {field?.is_required && <Badge className="text-xs">Obligatoriu</Badge>}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Asociază produs
        </Button>
      </div>

      {field?.hint_text && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground"><strong>Hint client:</strong> {field.hint_text}</p>
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
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Niciun produs asociat. Adaugă produse pentru a activa câmpul.
                </TableCell></TableRow>
              ) : items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[220px]">{item.product?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.product?.sku || "—"}</TableCell>
                  <TableCell className="text-sm">{item.product?.price} RON</TableCell>
                  <TableCell>
                    <Badge variant={item.product?.status === "active" ? "default" : "secondary"} className="text-xs">
                      {item.product?.status === "active" ? "Activ" : "Inactiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMutation.mutate(item.id)}>
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
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asociază produs la câmpul "{field?.display_name}"</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută după nume sau SKU..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {searchProducts.map((p: any) => {
                const already = existingIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2 rounded transition-colors ${already ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"}`}
                    onClick={() => !already && addMutation.mutate(p.id)}
                  >
                    <div className="w-9 h-9 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price} RON {p.sku ? `· ${p.sku}` : ""}</p>
                    </div>
                    {already ? <Badge variant="secondary" className="text-xs shrink-0">Asociat</Badge> : <Plus className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })}
              {addSearch.length >= 2 && searchProducts.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Niciun produs găsit</p>
              )}
              {addSearch.length < 2 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Tastează minim 2 caractere</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
