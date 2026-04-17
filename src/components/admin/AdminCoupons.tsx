import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Copy, Search, Shuffle, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface CouponForm {
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  is_active: boolean;
  description: string;
  valid_from: string;
  valid_until: string;
  applies_to: string;
  category_ids: string[];
  product_ids: string[];
  min_quantity: number | null;
  max_uses_per_customer: number | null;
  customer_scope: string;
  customer_group_ids: string[];
  specific_customer_id: string;
  first_order_only: boolean;
  combine_with_promotions: boolean;
  combine_with_codes: boolean;
  includes_free_shipping: boolean;
}

const emptyForm: CouponForm = {
  code: "", discount_type: "percentage", discount_value: 0,
  min_order_value: null, max_uses: null, is_active: true, description: "",
  valid_from: "", valid_until: "", applies_to: "all",
  category_ids: [], product_ids: [], min_quantity: null,
  max_uses_per_customer: null, customer_scope: "all",
  customer_group_ids: [], specific_customer_id: "",
  first_order_only: false, combine_with_promotions: true,
  combine_with_codes: false, includes_free_shipping: false,
};

function generateCode(prefix = "", length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkQty, setBulkQty] = useState(10);
  const [bulkLength, setBulkLength] = useState(8);
  const [statsId, setStatsId] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").is("parent_code_id", null).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["admin-customer-groups-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["coupon-stats", statsId],
    enabled: !!statsId,
    queryFn: async () => {
      const { data: usages } = await supabase.from("coupon_usage").select("*, orders(id, total, created_at, user_email)").eq("coupon_id", statsId!).order("created_at", { ascending: false });
      return usages || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (coupon: CouponForm & { id?: string }) => {
      const payload: any = {
        code: coupon.code.toUpperCase(),
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value,
        max_uses: coupon.max_uses,
        is_active: coupon.is_active,
        description: coupon.description,
        valid_from: coupon.valid_from || null,
        valid_until: coupon.valid_until || null,
        applies_to: coupon.applies_to,
        category_ids: coupon.category_ids,
        product_ids: coupon.product_ids,
        min_quantity: coupon.min_quantity,
        max_uses_per_customer: coupon.max_uses_per_customer,
        customer_scope: coupon.customer_scope,
        customer_group_ids: coupon.customer_group_ids,
        specific_customer_id: coupon.specific_customer_id || null,
        first_order_only: coupon.first_order_only,
        combine_with_promotions: coupon.combine_with_promotions,
        combine_with_codes: coupon.combine_with_codes,
        includes_free_shipping: coupon.includes_free_shipping,
      };
      if (coupon.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", coupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDialogOpen(false); setEditingId(null); setForm(emptyForm);
      toast.success(editingId ? "Cupon actualizat!" : "Cupon creat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupon șters!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const bulkGenerate = useMutation({
    mutationFn: async () => {
      const codes = Array.from({ length: bulkQty }, () => ({
        ...form,
        code: generateCode(bulkPrefix, bulkLength),
        max_uses: 1,
        max_uses_per_customer: 1,
      }));
      // Save parent first
      const { data: parent, error: pe } = await supabase.from("coupons").insert({
        code: `BULK-${bulkPrefix}${Date.now().toString(36).toUpperCase()}`,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_value: form.min_order_value,
        max_uses: bulkQty,
        is_active: true,
        description: `Bulk: ${bulkQty} coduri cu prefix ${bulkPrefix}`,
        applies_to: form.applies_to,
        first_order_only: form.first_order_only,
        combine_with_promotions: form.combine_with_promotions,
        combine_with_codes: form.combine_with_codes,
        includes_free_shipping: form.includes_free_shipping,
      }).select("id").single();
      if (pe || !parent) throw pe || new Error("Failed");

      const rows = codes.map(c => ({
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_order_value: c.min_order_value,
        max_uses: 1,
        max_uses_per_customer: 1,
        is_active: true,
        description: form.description,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        applies_to: form.applies_to,
        first_order_only: form.first_order_only,
        combine_with_promotions: form.combine_with_promotions,
        combine_with_codes: form.combine_with_codes,
        includes_free_shipping: form.includes_free_shipping,
        parent_code_id: parent.id,
      }));
      const { error } = await supabase.from("coupons").insert(rows);
      if (error) throw error;
      return codes.map(c => c.code);
    },
    onSuccess: (codes) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setBulkOpen(false);
      // Download CSV
      const csv = "Cod\n" + codes.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `coduri-${bulkPrefix || "bulk"}.csv`; a.click();
      toast.success(`${codes.length} coduri generate și descărcate!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      min_order_value: c.min_order_value, max_uses: c.max_uses, is_active: c.is_active,
      description: c.description || "", valid_from: c.valid_from || "", valid_until: c.valid_until || "",
      applies_to: c.applies_to || "all", category_ids: c.category_ids || [],
      product_ids: c.product_ids || [], min_quantity: c.min_quantity,
      max_uses_per_customer: c.max_uses_per_customer, customer_scope: c.customer_scope || "all",
      customer_group_ids: c.customer_group_ids || [], specific_customer_id: c.specific_customer_id || "",
      first_order_only: c.first_order_only || false, combine_with_promotions: c.combine_with_promotions ?? true,
      combine_with_codes: c.combine_with_codes || false, includes_free_shipping: c.includes_free_shipping || false,
    });
    setDialogOpen(true);
  };

  const duplicate = (c: any) => {
    openEdit({ ...c, id: undefined });
    setEditingId(null);
    setForm(prev => ({ ...prev, code: generateCode("", 8) }));
  };

  const getStatus = (c: any) => {
    if (!c.is_active) return "inactive";
    if (c.valid_until && new Date(c.valid_until) < new Date()) return "expired";
    if (c.max_uses && (c.used_count || 0) >= c.max_uses) return "exhausted";
    return "active";
  };

  const filtered = coupons.filter((c: any) => {
    const status = getStatus(c);
    if (filterStatus !== "all" && status !== filterStatus) return false;
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statsCoupon = statsId ? coupons.find((c: any) => c.id === statsId) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Coduri de Reducere ({coupons.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                <Shuffle className="w-4 h-4 mr-1" /> Generare Bulk
              </Button>
              <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Adaugă Cod
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Caută cod..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expirate</SelectItem>
                <SelectItem value="inactive">Dezactivate</SelectItem>
                <SelectItem value="exhausted">Epuizate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cod</TableHead>
                  <TableHead>Tip / Valoare</TableHead>
                  <TableHead>Utilizări</TableHead>
                  <TableHead>Expiră</TableHead>
                  <TableHead>Venit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => {
                  const status = getStatus(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold text-xs">{c.code}</TableCell>
                      <TableCell className="text-sm">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : c.discount_type === "free_shipping" ? "Transport gratuit" : c.discount_type === "combined" ? `${c.discount_value}% + transport` : `${Number(c.discount_value).toFixed(0)} RON`}
                      </TableCell>
                      <TableCell className="text-sm">{c.used_count || 0} / {c.max_uses || "∞"}</TableCell>
                      <TableCell className="text-sm">{c.valid_until ? new Date(c.valid_until).toLocaleDateString("ro") : "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{Number(c.revenue_generated || 0).toFixed(0)} lei</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={status === "active" ? "default" : "secondary"} className="text-xs">
                            {status === "active" ? "Activ" : status === "expired" ? "Expirat" : status === "exhausted" ? "Epuizat" : "Inactiv"}
                          </Badge>
                          <Switch checked={c.is_active} onCheckedChange={v => toggleActive.mutate({ id: c.id, active: v })} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setStatsId(c.id)} title="Statistici">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => duplicate(c)} title="Duplică">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Ștergi acest cod?")) deleteMutation.mutate(c.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Niciun cod găsit</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editează Cod" : "Cod Nou de Reducere"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate({ ...form, id: editingId || undefined }); }} className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="basic">Cod & Tip</TabsTrigger>
                <TabsTrigger value="scope">Se Aplică</TabsTrigger>
                <TabsTrigger value="conditions">Condiții</TabsTrigger>
                <TabsTrigger value="stacking">Stacking</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cod</Label>
                    <div className="flex gap-2">
                      <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="font-mono" />
                      <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, code: generateCode() })} title="Generează">
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tip reducere</Label>
                    <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Procentuală (%)</SelectItem>
                        <SelectItem value="fixed">Sumă fixă (RON)</SelectItem>
                        <SelectItem value="free_shipping">Transport gratuit</SelectItem>
                        <SelectItem value="combined">Combinat (% + transport)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.discount_type !== "free_shipping" && (
                  <div className="space-y-2">
                    <Label>Valoare discount</Label>
                    <Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Descriere (intern)</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid de la</Label>
                    <Input type="datetime-local" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid până la</Label>
                    <Input type="datetime-local" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <Label>Activ</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.includes_free_shipping} onCheckedChange={v => setForm({ ...form, includes_free_shipping: v })} />
                  <Label>Include transport gratuit</Label>
                </div>
              </TabsContent>

              <TabsContent value="scope" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Se aplică la produse</Label>
                  <Select value={form.applies_to} onValueChange={v => setForm({ ...form, applies_to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate produsele</SelectItem>
                      <SelectItem value="categories">Categorii specifice</SelectItem>
                      <SelectItem value="products">Produse specifice</SelectItem>
                      <SelectItem value="first_expensive">Primul produs (cel mai scump)</SelectItem>
                      <SelectItem value="first_cheapest">Primul produs (cel mai ieftin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.applies_to === "categories" && (
                  <div className="space-y-2">
                    <Label>Categorii</Label>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded p-2">
                      {categories.map((cat: any) => (
                        <label key={cat.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.category_ids.includes(cat.id)}
                            onChange={e => setForm({ ...form, category_ids: e.target.checked ? [...form.category_ids, cat.id] : form.category_ids.filter(id => id !== cat.id) })} />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Se aplică la clienți</Label>
                  <Select value={form.customer_scope} onValueChange={v => setForm({ ...form, customer_scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toți clienții</SelectItem>
                      <SelectItem value="groups">Grupuri specifice</SelectItem>
                      <SelectItem value="specific">Un singur client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.customer_scope === "groups" && (
                  <div className="space-y-2">
                    <Label>Grupuri clienți</Label>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded p-2">
                      {customerGroups.map((g: any) => (
                        <label key={g.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.customer_group_ids.includes(g.id)}
                            onChange={e => setForm({ ...form, customer_group_ids: e.target.checked ? [...form.customer_group_ids, g.id] : form.customer_group_ids.filter(id => id !== g.id) })} />
                          {g.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {form.customer_scope === "specific" && (
                  <div className="space-y-2">
                    <Label>ID Client</Label>
                    <Input value={form.specific_customer_id} onChange={e => setForm({ ...form, specific_customer_id: e.target.value })} placeholder="UUID client" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch checked={form.first_order_only} onCheckedChange={v => setForm({ ...form, first_order_only: v })} />
                  <Label>Doar prima comandă</Label>
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valoare minimă comandă (lei)</Label>
                    <Input type="number" value={form.min_order_value ?? ""} onChange={e => setForm({ ...form, min_order_value: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantitate minimă produse</Label>
                    <Input type="number" value={form.min_quantity ?? ""} onChange={e => setForm({ ...form, min_quantity: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Utilizări totale maxime</Label>
                    <Input type="number" value={form.max_uses ?? ""} onChange={e => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="0 = nelimitat" />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilizări per client</Label>
                    <Input type="number" value={form.max_uses_per_customer ?? ""} onChange={e => setForm({ ...form, max_uses_per_customer: e.target.value ? Number(e.target.value) : null })} placeholder="1 = single use" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stacking" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Combinabil cu promoții active</p>
                    <p className="text-xs text-muted-foreground">Codul se aplică și dacă există promoții</p>
                  </div>
                  <Switch checked={form.combine_with_promotions} onCheckedChange={v => setForm({ ...form, combine_with_promotions: v })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Combinabil cu alte coduri</p>
                    <p className="text-xs text-muted-foreground">Permite utilizarea simultană a mai multor coduri</p>
                  </div>
                  <Switch checked={form.combine_with_codes} onCheckedChange={v => setForm({ ...form, combine_with_codes: v })} />
                </div>
              </TabsContent>
            </Tabs>

            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Se salvează..." : "Salvează"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ Bulk Generate Dialog ═══ */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generare Bulk Coduri</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Prefix</Label>
                <Input value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value.toUpperCase())} placeholder="VARA25-" />
              </div>
              <div className="space-y-2">
                <Label>Lungime cod</Label>
                <Input type="number" value={bulkLength} onChange={e => setBulkLength(Number(e.target.value))} min={4} max={16} />
              </div>
              <div className="space-y-2">
                <Label>Cantitate</Label>
                <Input type="number" value={bulkQty} onChange={e => setBulkQty(Number(e.target.value))} min={1} max={1000} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tip reducere</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Procentuală (%)</SelectItem>
                    <SelectItem value="fixed">Sumă fixă (RON)</SelectItem>
                    <SelectItem value="free_shipping">Transport gratuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valoare</Label>
                <Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valid de la</Label>
                <Input type="datetime-local" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Valid până la</Label>
                <Input type="datetime-local" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Fiecare cod generat va fi single-use (max 1 utilizare per client). CSV-ul se descarcă automat.</p>
            <Button className="w-full" onClick={() => bulkGenerate.mutate()} disabled={bulkGenerate.isPending}>
              <Download className="w-4 h-4 mr-1" /> {bulkGenerate.isPending ? "Se generează..." : `Generează ${bulkQty} coduri`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Stats Drawer ═══ */}
      <Sheet open={!!statsId} onOpenChange={open => { if (!open) setStatsId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Statistici — {statsCoupon?.code}</SheetTitle>
          </SheetHeader>
          {statsCoupon && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{statsCoupon.used_count || 0}</p><p className="text-xs text-muted-foreground">Utilizări</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{Number(statsCoupon.total_discount_given || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Discount (lei)</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{Number(statsCoupon.revenue_generated || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Venit (lei)</p></CardContent></Card>
              </div>
              <h3 className="font-semibold text-sm">Comenzi care au folosit codul</h3>
              {statsData && statsData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comandă</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsData.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.order_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{(u.orders as any)?.user_email || "—"}</TableCell>
                        <TableCell className="text-sm">{Number((u.orders as any)?.total || 0).toFixed(0)} lei</TableCell>
                        <TableCell className="text-sm">{new Date(u.created_at).toLocaleDateString("ro")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nicio utilizare încă.</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
