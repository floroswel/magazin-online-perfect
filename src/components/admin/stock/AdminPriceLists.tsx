import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ListOrdered, Plus, Edit, Trash2, Download, Upload, CalendarIcon,
  Search, Save, FileDown, Settings, Tag, Loader2, AlertTriangle, X, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ───── types ─────
interface PriceList {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  tax_included: boolean;
  status: string;
  created_at: string;
  item_count?: number;
  groups?: { id: string; name: string; color: string | null }[];
}

interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  sku: string | null;
  preferential_price: number;
  product?: { id: string; name: string; price: number; sku: string | null; image_url: string | null };
}

// ───── settings check ─────
function useModuleEnabled() {
  return useQuery({
    queryKey: ["price-lists-enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "price_lists_enabled")
        .maybeSingle();
      return data?.value_json === true;
    },
  });
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function AdminPriceLists() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading: loadingEnabled } = useModuleEnabled();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importListId, setImportListId] = useState<string | null>(null);
  const [exportListId, setExportListId] = useState<string | null>(null);

  // fetch all lists with counts
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["admin-price-lists"],
    queryFn: async () => {
      const { data: pls } = await supabase
        .from("price_lists" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (!pls) return [];
      // get groups and item counts
      const ids = (pls as any[]).map((p: any) => p.id);
      const { data: plGroups } = await supabase
        .from("price_list_groups" as any)
        .select("price_list_id, customer_group:customer_groups(id, name, color)")
        .in("price_list_id", ids.length ? ids : ["__none__"]);
      const { data: plItems } = await supabase
        .from("price_list_items" as any)
        .select("price_list_id")
        .in("price_list_id", ids.length ? ids : ["__none__"]);

      return (pls as any[]).map((p: any) => ({
        ...p,
        groups: (plGroups as any[] || [])
          .filter((g: any) => g.price_list_id === p.id)
          .map((g: any) => g.customer_group),
        item_count: (plItems as any[] || []).filter((i: any) => i.price_list_id === p.id).length,
      })) as PriceList[];
    },
    enabled: enabled === true,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newSt = status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("price_lists" as any).update({ status: newSt } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-price-lists"] });
      toast.success("Status actualizat!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_lists" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-price-lists"] });
      toast.success("Lista de prețuri ștearsă!");
    },
  });

  if (loadingEnabled) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  if (!enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Liste de Prețuri Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Activează modulul din Setări → Liste de Prețuri pentru a folosi această funcție.
          </p>
          <Link to="/admin/settings/price-lists">
            <Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări Liste de Prețuri</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Detail view for a specific list
  if (detailId) {
    return <PriceListDetail listId={detailId} onBack={() => { setDetailId(null); queryClient.invalidateQueries({ queryKey: ["admin-price-lists"] }); }} />;
  }

  const activeLists = lists.filter((l) => l.status === "active").length;
  const expiringLists = lists.filter((l) => {
    if (!l.valid_to) return false;
    const diff = new Date(l.valid_to).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" /> Liste de Prețuri
            {expiringLists > 0 && <Badge variant="destructive" className="text-xs">{expiringLists} expiră curând</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează prețuri preferențiale pe grupuri de clienți</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings/price-lists">
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" /> Setări</Button>
          </Link>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă listă de prețuri
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{lists.length}</p><p className="text-xs text-muted-foreground">Total liste</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{activeLists}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{lists.reduce((s, l) => s + (l.item_count || 0), 0)}</p><p className="text-xs text-muted-foreground">Total produse în liste</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate listele de prețuri</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denumire</TableHead>
                <TableHead>Grupuri clienți</TableHead>
                <TableHead>Valabilitate</TableHead>
                <TableHead>#Produse</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : lists.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio listă creată.</TableCell></TableRow>
              ) : lists.map((pl) => {
                const isExpiring = pl.valid_to && new Date(pl.valid_to).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && new Date(pl.valid_to).getTime() > Date.now();
                return (
                  <TableRow key={pl.id}>
                    <TableCell>
                      <span className="font-medium text-sm">{pl.name}</span>
                      {isExpiring && <Badge variant="destructive" className="ml-2 text-[10px]">Expiră curând</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(pl.groups || []).map((g: any) => (
                          <Badge key={g.id} variant="outline" className="text-xs" style={g.color ? { borderColor: g.color, color: g.color } : {}}>{g.name}</Badge>
                        ))}
                        {(!pl.groups || pl.groups.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {pl.valid_from ? format(new Date(pl.valid_from), "dd.MM.yyyy") : "—"}
                      {" → "}
                      {pl.valid_to ? format(new Date(pl.valid_to), "dd.MM.yyyy") : "Nelimitat"}
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setDetailId(pl.id)}>
                        {pl.item_count || 0} produse
                      </Button>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{pl.tax_included ? "Cu TVA" : "Fără TVA"}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={pl.status === "active"} onCheckedChange={() => toggleStatus.mutate({ id: pl.id, status: pl.status })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(pl.id)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExportListId(pl.id)}><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(pl.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <PriceListFormDialog
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
          onSaved={() => {
            setShowCreate(false);
            setEditId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-price-lists"] });
          }}
        />
      )}

      {/* Export Dialog */}
      {exportListId && <ExportDialog listId={exportListId} onClose={() => setExportListId(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
// CREATE / EDIT FORM DIALOG
// ═══════════════════════════════════════════════
function PriceListFormDialog({ editId, onClose, onSaved }: { editId: string | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [validFrom, setValidFrom] = useState<Date | undefined>();
  const [validTo, setValidTo] = useState<Date | undefined>();
  const [noExpiry, setNoExpiry] = useState(true);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ["all-customer-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name, color").order("name");
      return data || [];
    },
  });

  // Load existing data for edit
  const { data: existing } = useQuery({
    queryKey: ["price-list-edit", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data: pl } = await supabase.from("price_lists" as any).select("*").eq("id", editId).maybeSingle();
      const { data: plg } = await supabase.from("price_list_groups" as any).select("customer_group_id").eq("price_list_id", editId);
      return { ...(pl as any), groupIds: (plg as any[] || []).map((g: any) => g.customer_group_id) };
    },
    enabled: !!editId,
  });

  // Populate form when editing
  useState(() => {
    if (existing) {
      setName(existing.name);
      setValidFrom(existing.valid_from ? new Date(existing.valid_from) : undefined);
      setValidTo(existing.valid_to ? new Date(existing.valid_to) : undefined);
      setNoExpiry(!existing.valid_to);
      setTaxIncluded(existing.tax_included);
      setSelectedGroups(existing.groupIds || []);
    }
  });

  // Re-populate on existing change
  const [loaded, setLoaded] = useState(false);
  if (existing && !loaded) {
    setName(existing.name);
    if (existing.valid_from) setValidFrom(new Date(existing.valid_from));
    if (existing.valid_to) { setValidTo(new Date(existing.valid_to)); setNoExpiry(false); }
    setTaxIncluded(existing.tax_included);
    setSelectedGroups(existing.groupIds || []);
    setLoaded(true);
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Numele este obligatoriu"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        valid_from: validFrom ? validFrom.toISOString().split("T")[0] : null,
        valid_to: noExpiry ? null : validTo ? validTo.toISOString().split("T")[0] : null,
        tax_included: taxIncluded,
        updated_at: new Date().toISOString(),
      };

      let listId: string;
      if (editId) {
        const { error } = await supabase.from("price_lists" as any).update(payload).eq("id", editId);
        if (error) throw error;
        listId = editId;
      } else {
        payload.status = "active";
        const { data, error } = await supabase.from("price_lists" as any).insert(payload).select("id").single();
        if (error) throw error;
        listId = (data as any).id;
      }

      // Sync groups
      await supabase.from("price_list_groups" as any).delete().eq("price_list_id", listId);
      if (selectedGroups.length > 0) {
        const rows = selectedGroups.map((gid) => ({ price_list_id: listId, customer_group_id: gid }));
        await supabase.from("price_list_groups" as any).insert(rows);
      }

      toast.success(editId ? "Lista actualizată!" : "Lista creată!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (gid: string) => {
    setSelectedGroups((prev) => prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editId ? "Editare listă de prețuri" : "Adaugă listă de prețuri"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Denumire (referință internă)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lista B2B Gold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !validFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {validFrom ? format(validFrom, "dd.MM.yyyy") : "Selectează"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={validFrom} onSelect={setValidFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data expirare</Label>
              {noExpiry ? (
                <div className="flex items-center gap-2 h-10">
                  <Badge variant="secondary">Fără expirare</Badge>
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !validTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {validTo ? format(validTo, "dd.MM.yyyy") : "Selectează"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={validTo} onSelect={setValidTo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Checkbox checked={noExpiry} onCheckedChange={(v) => setNoExpiry(!!v)} id="no-exp" />
                <Label htmlFor="no-exp" className="text-xs cursor-pointer">Fără dată de expirare</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Setare TVA</Label>
            <RadioGroup value={taxIncluded ? "included" : "excluded"} onValueChange={(v) => setTaxIncluded(v === "included")} className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="included" id="tax-incl" />
                <Label htmlFor="tax-incl" className="text-sm cursor-pointer">Prețurile importate includ TVA</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="excluded" id="tax-excl" />
                <Label htmlFor="tax-excl" className="text-sm cursor-pointer">Prețurile importate nu includ TVA</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Grupuri de clienți</Label>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
              {groups.map((g: any) => (
                <Badge
                  key={g.id}
                  variant={selectedGroups.includes(g.id) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  style={selectedGroups.includes(g.id) && g.color ? { backgroundColor: g.color, borderColor: g.color } : g.color ? { borderColor: g.color, color: g.color } : {}}
                  onClick={() => toggleGroup(g.id)}
                >
                  {g.name}
                </Badge>
              ))}
              {groups.length === 0 && <span className="text-xs text-muted-foreground">Niciun grup creat</span>}
            </div>
          </div>
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
// PRICE LIST DETAIL (items view + import + manual add)
// ═══════════════════════════════════════════════
function PriceListDetail({ listId, onBack }: { listId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addProductId, setAddProductId] = useState<string | null>(null);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  const { data: list } = useQuery({
    queryKey: ["price-list-detail-meta", listId],
    queryFn: async () => {
      const { data } = await supabase.from("price_lists" as any).select("*").eq("id", listId).maybeSingle();
      return data as any;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["price-list-items", listId, search],
    queryFn: async () => {
      let q = supabase
        .from("price_list_items" as any)
        .select("*, product:products(id, name, price, sku, image_url)")
        .eq("price_list_id", listId)
        .order("created_at", { ascending: false });
      const { data } = await q;
      let results = (data as any[]) || [];
      if (search) {
        const s = search.toLowerCase();
        results = results.filter((i: any) =>
          i.product?.name?.toLowerCase().includes(s) || i.product?.sku?.toLowerCase().includes(s)
        );
      }
      return results as PriceListItem[];
    },
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["products-for-pricelist", addSearch],
    queryFn: async () => {
      if (!addSearch) return [];
      const { data } = await supabase.from("products").select("id, name, price, sku, image_url")
        .or(`name.ilike.%${addSearch}%,sku.ilike.%${addSearch}%`)
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: addSearch.length > 1,
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ productId, price }: { productId: string; price: number }) => {
      const { error } = await supabase.from("price_list_items" as any).upsert({
        price_list_id: listId,
        product_id: productId,
        preferential_price: price,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "price_list_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", listId] });
      toast.success("Produs adăugat/actualizat!");
      setAddProductId(null);
      setAddPrice("");
      setShowAddProduct(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: string; price: number }) => {
      const { error } = await supabase.from("price_list_items" as any).update({ preferential_price: price, updated_at: new Date().toISOString() } as any).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", listId] });
      toast.success("Preț actualizat!");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("price_list_items" as any).delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", listId] });
      toast.success("Produs eliminat din listă!");
    },
  });

  const handleImportCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { toast.error("Fișierul nu conține date"); return; }

    let imported = 0;
    let errors = 0;
    // skip header
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 2) { errors++; continue; }
      const identifier = cols[0];
      const price = parseFloat(cols[1]);
      if (isNaN(price)) { errors++; continue; }

      // Try match by ID or SKU
      const { data: prod } = await supabase.from("products").select("id")
        .or(`id.eq.${identifier},sku.eq.${identifier}`).limit(1).maybeSingle();
      if (!prod) { errors++; continue; }

      const { error } = await supabase.from("price_list_items" as any).upsert({
        price_list_id: listId,
        product_id: prod.id,
        preferential_price: price,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "price_list_id,product_id" });
      if (error) { errors++; } else { imported++; }
    }

    queryClient.invalidateQueries({ queryKey: ["price-list-items", listId] });
    toast.success(`Import finalizat: ${imported} produse importate, ${errors} erori`);
    setShowImport(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><X className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{list?.name || "..."}</h1>
            <p className="text-sm text-muted-foreground">{items.length} produse în listă</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-1" /> Import CSV</Button>
          <Button size="sm" onClick={() => setShowAddProduct(true)}><Plus className="w-4 h-4 mr-1" /> Adaugă produs</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută produs sau SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preț standard</TableHead>
                <TableHead>Preț conform listă</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="w-20">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Niciun produs în listă. Importă sau adaugă manual.</TableCell></TableRow>
              ) : items.map((item) => {
                const discount = item.product?.price ? Math.round((1 - item.preferential_price / item.product.price) * 100) : 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                          {item.product?.image_url ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{item.product?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.product?.sku || "—"}</TableCell>
                    <TableCell className="text-sm">{item.product?.price} RON</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-24 h-8 text-sm"
                          value={editingPrices[item.id] ?? item.preferential_price}
                          onChange={(e) => setEditingPrices((p) => ({ ...p, [item.id]: e.target.value }))}
                        />
                        {editingPrices[item.id] !== undefined && editingPrices[item.id] !== String(item.preferential_price) && (
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                            updatePriceMutation.mutate({ itemId: item.id, price: +editingPrices[item.id] });
                            setEditingPrices((p) => { const n = { ...p }; delete n[item.id]; return n; });
                          }}>
                            <Save className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {discount > 0 && <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs">-{discount}%</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItemMutation.mutate(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adaugă produs în listă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută după nume sau SKU..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {searchProducts.map((p: any) => (
                <div
                  key={p.id}
                  className={cn("flex items-center gap-3 p-2 rounded cursor-pointer transition-colors", addProductId === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50")}
                  onClick={() => setAddProductId(p.id)}
                >
                  <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3 h-3 text-muted-foreground m-auto mt-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.price} RON {p.sku ? `· ${p.sku}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
            {addProductId && (
              <div>
                <Label>Preț preferențial (RON)</Label>
                <Input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="0.00" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Anulează</Button>
            <Button
              disabled={!addProductId || !addPrice || addItemMutation.isPending}
              onClick={() => addItemMutation.mutate({ productId: addProductId!, price: +addPrice })}
            >
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import prețuri din CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fișierul trebuie să conțină 2 coloane: <strong>ID/SKU produs</strong> și <strong>Preț</strong>, separate prin virgulă, punct-și-virgulă sau tab.
            </p>
            <Button variant="outline" size="sm" onClick={() => {
              const csv = "product_id_or_sku,price\nSKU-001,149.99\nSKU-002,89.50";
              const blob = new Blob([csv], { type: "text/csv" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "template_lista_preturi.csv"; a.click();
            }}>
              <FileDown className="w-4 h-4 mr-1" /> Descarcă fișier exemplu
            </Button>
            <div>
              <Label>Încarcă fișier CSV</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportCSV(f);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════
// EXPORT DIALOG
// ═══════════════════════════════════════════════
function ExportDialog({ listId, onClose }: { listId: string; onClose: () => void }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: items } = await supabase
        .from("price_list_items" as any)
        .select("product_id, preferential_price, product:products(name, sku, price)")
        .eq("price_list_id", listId);

      if (!items || (items as any[]).length === 0) {
        toast.error("Lista nu conține produse");
        return;
      }

      const rows = (items as any[]).map((i: any) => [
        i.product_id,
        i.product?.sku || "",
        i.product?.name || "",
        i.product?.price || 0,
        i.preferential_price,
      ]);

      const csv = [
        ["ID Produs", "SKU", "Nume", "Preț Standard", "Preț Preferențial"].join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `lista_preturi_export.csv`; a.click();
      toast.success("Export finalizat!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Exportă lista de prețuri</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Se va genera un fișier CSV cu toate produsele și prețurile din această listă.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            Exportă CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
