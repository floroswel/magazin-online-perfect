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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Edit, Trash2, Search, Save, Loader2, Package, Settings,
  Copy, Download, FileText, Mail, X, ClipboardList, Truck, BarChart3,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "În așteptare", color: "bg-muted text-muted-foreground" },
  sent: { label: "Trimisă", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  partial: { label: "Primită parțial", color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  received: { label: "Recepționată", color: "bg-green-500/15 text-green-600 border-green-500/30" },
};

function useModuleEnabled() {
  return useQuery({
    queryKey: ["stock-manager-enabled"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "stock_manager_enabled").maybeSingle();
      return data?.value_json === true;
    },
  });
}

export default function AdminPurchaseOrders() {
  const qc = useQueryClient();
  const { data: enabled, isLoading: loadingEnabled } = useModuleEnabled();
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showReceive, setShowReceive] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-purchase-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_orders" as any)
        .select("*, supplier:suppliers(name)")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: enabled === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-purchase-orders"] });
      toast.success("Comandă ștearsă!");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: orig } = await supabase.from("purchase_orders" as any).select("*").eq("id", orderId).maybeSingle();
      if (!orig) throw new Error("Not found");
      const o = orig as any;
      const { data: newOrder, error } = await supabase.from("purchase_orders" as any).insert({
        type: o.type, supplier_id: o.supplier_id, supplier_name_snapshot: o.supplier_name_snapshot,
        warehouse_id: o.warehouse_id, status: "pending", internal_note: o.internal_note,
        total_acquisition_cost: o.total_acquisition_cost,
      } as any).select().single();
      if (error) throw error;
      const { data: items } = await supabase.from("purchase_order_items" as any).select("*").eq("purchase_order_id", orderId);
      if (items && (items as any[]).length > 0) {
        const copies = (items as any[]).map((i: any) => ({
          purchase_order_id: (newOrder as any).id, product_id: i.product_id,
          product_name_snapshot: i.product_name_snapshot, variant_id: i.variant_id,
          sku: i.sku, ean: i.ean, quantity_ordered: i.quantity_ordered,
          quantity_received: 0, acquisition_cost_net: i.acquisition_cost_net,
          new_sale_price: i.new_sale_price,
        }));
        await supabase.from("purchase_order_items" as any).insert(copies as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-purchase-orders"] });
      toast.success("Comanda a fost duplicată!");
    },
  });

  if (loadingEnabled) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;
  if (!enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Manager Stocuri Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">Activează din Setări → Manager Stocuri.</p>
          <Link to="/admin/settings/stock-manager"><Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări</Button></Link>
        </CardContent>
      </Card>
    );
  }

  if (detailId) {
    return <OrderDetail orderId={detailId} onBack={() => { setDetailId(null); qc.invalidateQueries({ queryKey: ["admin-purchase-orders"] }); }} />;
  }

  if (showReceive) {
    return <ReceiveGoods orderId={showReceive} onBack={() => { setShowReceive(null); qc.invalidateQueries({ queryKey: ["admin-purchase-orders"] }); }} />;
  }

  let filtered = orders;
  if (filterType !== "all") filtered = filtered.filter((o: any) => o.type === filterType);
  if (filterStatus !== "all") filtered = filtered.filter((o: any) => o.status === filterStatus);
  if (searchTerm) filtered = filtered.filter((o: any) =>
    o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier_name_snapshot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.supplier as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Comenzi Furnizor & Recepții</h1>
          <p className="text-sm text-muted-foreground">Gestionare comenzi de aprovizionare și recepție marfă</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/stock/suppliers"><Button variant="outline" size="sm"><Truck className="w-4 h-4 mr-1" /> Furnizori</Button></Link>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{orders.length}</p><p className="text-xs text-muted-foreground">Total comenzi/recepții</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{orders.filter((o: any) => o.status === "pending").length}</p><p className="text-xs text-muted-foreground">În așteptare</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{orders.filter((o: any) => o.status === "partial").length}</p><p className="text-xs text-muted-foreground">Primite parțial</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-foreground">{orders.filter((o: any) => o.status === "received").length}</p><p className="text-xs text-muted-foreground">Recepționate</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tip" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            <SelectItem value="supplier_order">Comenzi furnizor</SelectItem>
            <SelectItem value="reception">Recepție marfă</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="sent">Trimisă</SelectItem>
            <SelectItem value="partial">Primită parțial</SelectItem>
            <SelectItem value="received">Recepționată</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Furnizor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recepționat</TableHead>
                <TableHead>Cost total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-32">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nicio comandă/recepție.</TableCell></TableRow>
              ) : filtered.map((order: any) => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                const supplierName = (order.supplier as any)?.name || order.supplier_name_snapshot || "—";
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary font-mono text-xs" onClick={() => setDetailId(order.id)}>
                        {order.id?.slice(0, 8)}...
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {order.type === "reception" ? "Recepție" : "Comandă"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{supplierName}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge></TableCell>
                    <TableCell className="w-32">
                      <ReceivedProgress orderId={order.id} />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{Number(order.total_acquisition_cost || 0).toFixed(2)} RON</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Produse" onClick={() => setDetailId(order.id)}><Package className="h-3.5 w-3.5" /></Button>
                        {order.status !== "received" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Recepționează" onClick={() => setShowReceive(order.id)}><Download className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplică" onClick={() => duplicateMutation.mutate(order.id)}><Copy className="h-3.5 w-3.5" /></Button>
                        {order.status !== "received" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Șterge" onClick={() => deleteMutation.mutate(order.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showCreate && <CreateOrderDialog onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["admin-purchase-orders"] }); }} />}
    </div>
  );
}

// ═══════════ RECEIVED PROGRESS ═══════════
function ReceivedProgress({ orderId }: { orderId: string }) {
  const { data } = useQuery({
    queryKey: ["po-progress", orderId],
    queryFn: async () => {
      const { data: items } = await supabase.from("purchase_order_items" as any).select("quantity_ordered, quantity_received").eq("purchase_order_id", orderId);
      if (!items || (items as any[]).length === 0) return 0;
      const totalOrd = (items as any[]).reduce((s: number, i: any) => s + (i.quantity_ordered || 0), 0);
      const totalRec = (items as any[]).reduce((s: number, i: any) => s + (i.quantity_received || 0), 0);
      return totalOrd > 0 ? Math.round((totalRec / totalOrd) * 100) : 0;
    },
  });
  const pct = data ?? 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ═══════════ CREATE ORDER/RECEPTION DIALOG ═══════════
function CreateOrderDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState("supplier_order");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers" as any).select("id, name").order("name");
      return (data as any[]) || [];
    },
  });

  const handleSave = async () => {
    if (type === "supplier_order" && !supplierId) { toast.error("Selectează un furnizor"); return; }
    setSaving(true);
    try {
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      const { error } = await supabase.from("purchase_orders" as any).insert({
        type,
        supplier_id: supplierId || null,
        supplier_name_snapshot: supplier?.name || null,
        status,
        internal_note: note.trim() || null,
      } as any);
      if (error) throw error;
      toast.success("Creat cu succes!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Adaugă {type === "reception" ? "recepție marfă" : "comandă furnizor"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tip *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="supplier_order">Comandă furnizor</SelectItem>
                <SelectItem value="reception">Recepție marfă</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{type === "supplier_order" ? "Furnizor *" : "Furnizor (opțional)"}</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Selectează furnizor" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status inițial</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">În așteptare (stoc neadăugat)</SelectItem>
                <SelectItem value="received">Recepționat (stoc adăugat instant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notă internă</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Creează
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════ ORDER DETAIL ═══════════
function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addCost, setAddCost] = useState(0);
  const [addPrice, setAddPrice] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: order } = useQuery({
    queryKey: ["po-detail", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders" as any).select("*, supplier:suppliers(name)").eq("id", orderId).maybeSingle();
      return data as any;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["po-items", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_order_items" as any)
        .select("*, product:products(id, name, sku, image_url, stock)")
        .eq("purchase_order_id", orderId)
        .order("created_at");
      return (data as any[]) || [];
    },
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["search-products-po", addSearch],
    queryFn: async () => {
      if (addSearch.length < 2) return [];
      const { data } = await supabase.from("products").select("id, name, sku, price, image_url, stock")
        .or(`name.ilike.%${addSearch}%,sku.ilike.%${addSearch}%`)
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: addSearch.length >= 2,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Selectează un produs");
      const { error } = await supabase.from("purchase_order_items" as any).insert({
        purchase_order_id: orderId,
        product_id: selectedProduct.id,
        product_name_snapshot: selectedProduct.name,
        sku: selectedProduct.sku || null,
        quantity_ordered: addQty,
        acquisition_cost_net: addCost,
        new_sale_price: addPrice,
      } as any);
      if (error) throw error;
      // Recalculate total
      await recalcTotal();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po-items", orderId] });
      toast.success("Produs adăugat!");
      setSelectedProduct(null); setAddSearch(""); setAddQty(1); setAddCost(0); setAddPrice(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("purchase_order_items" as any).delete().eq("id", itemId);
      if (error) throw error;
      await recalcTotal();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po-items", orderId] });
      toast.success("Produs eliminat!");
    },
  });

  const recalcTotal = async () => {
    const { data: allItems } = await supabase.from("purchase_order_items" as any).select("quantity_ordered, acquisition_cost_net").eq("purchase_order_id", orderId);
    const total = (allItems as any[] || []).reduce((s: number, i: any) => s + (i.quantity_ordered * i.acquisition_cost_net), 0);
    await supabase.from("purchase_orders" as any).update({ total_acquisition_cost: total, updated_at: new Date().toISOString() } as any).eq("id", orderId);
    qc.invalidateQueries({ queryKey: ["po-detail", orderId] });
  };

  const st = order ? (STATUS_MAP[order.status] || STATUS_MAP.pending) : STATUS_MAP.pending;
  const supplierName = order?.supplier?.name || order?.supplier_name_snapshot || "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><X className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> {order?.type === "reception" ? "Recepție" : "Comandă"} #{orderId?.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{supplierName}</span>
              <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Adaugă produs</Button>
      </div>

      {order?.internal_note && (
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground"><strong>Notă:</strong> {order.internal_note}</p></CardContent></Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Cantitate</TableHead>
                <TableHead>Recepționat</TableHead>
                <TableHead>Cost net</TableHead>
                <TableHead>Preț vânzare nou</TableHead>
                <TableHead className="w-16">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Niciun produs. Adaugă produse la această comandă.</TableCell></TableRow>
              ) : items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[200px]">{item.product?.name || item.product_name_snapshot}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{item.sku || item.product?.sku || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{item.quantity_ordered}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${item.quantity_received >= item.quantity_ordered ? "text-green-600" : item.quantity_received > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                      {item.quantity_received} / {item.quantity_ordered}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{Number(item.acquisition_cost_net || 0).toFixed(2)} RON</TableCell>
                  <TableCell className="text-sm">{item.new_sale_price ? `${Number(item.new_sale_price).toFixed(2)} RON` : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItemMutation.mutate(item.id)}><X className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Adaugă produs la comandă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută după nume sau SKU..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pl-9" />
            </div>
            {!selectedProduct && (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {searchProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku || "—"} · Stoc: {p.stock ?? 0}</p>
                    </div>
                  </div>
                ))}
                {addSearch.length >= 2 && searchProducts.length === 0 && <p className="text-center py-3 text-muted-foreground text-sm">Niciun produs găsit</p>}
              </div>
            )}
            {selectedProduct && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{selectedProduct.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setSelectedProduct(null)}><X className="w-3 h-3" /></Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Cantitate</Label><Input type="number" value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} min={1} /></div>
                  <div><Label>Cost achiziție net</Label><Input type="number" value={addCost} onChange={(e) => setAddCost(Number(e.target.value))} step="0.01" /></div>
                  <div><Label>Preț vânzare nou</Label><Input type="number" value={addPrice ?? ""} onChange={(e) => setAddPrice(e.target.value ? Number(e.target.value) : null)} step="0.01" placeholder="Opțional" /></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Anulează</Button>
            <Button onClick={() => addItemMutation.mutate()} disabled={!selectedProduct || addItemMutation.isPending}>
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════ RECEIVE GOODS ═══════════
function ReceiveGoods({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [receiving, setReceiving] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["po-items-receive", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_order_items" as any)
        .select("*, product:products(id, name, sku, image_url, stock)")
        .eq("purchase_order_id", orderId)
        .order("created_at");
      return (data as any[]) || [];
    },
  });

  const setQty = (itemId: string, qty: number) => setQuantities((prev) => ({ ...prev, [itemId]: qty }));

  const handleReceive = async () => {
    setReceiving(true);
    try {
      for (const item of items) {
        const qty = quantities[item.id] || 0;
        if (qty <= 0) continue;
        const remaining = item.quantity_ordered - item.quantity_received;
        const actualQty = Math.min(qty, remaining);
        if (actualQty <= 0) continue;

        // Update item received quantity
        await supabase.from("purchase_order_items" as any).update({
          quantity_received: item.quantity_received + actualQty,
          updated_at: new Date().toISOString(),
        } as any).eq("id", item.id);

        // Update product stock (INCREMENT)
        if (item.product_id) {
          const currentStock = item.product?.stock ?? 0;
          const newStock = currentStock + actualQty;
          await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);

          // Update sale price if set
          if (item.new_sale_price) {
            await supabase.from("products").update({ price: item.new_sale_price }).eq("id", item.product_id);
          }

          // Log reception
          await supabase.from("stock_reception_log" as any).insert({
            purchase_order_id: orderId,
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity_added: actualQty,
            previous_stock: currentStock,
            new_stock: newStock,
          } as any);
        }
      }

      // Calculate overall status
      const { data: updatedItems } = await supabase.from("purchase_order_items" as any).select("quantity_ordered, quantity_received").eq("purchase_order_id", orderId);
      const totalOrd = (updatedItems as any[] || []).reduce((s: number, i: any) => s + i.quantity_ordered, 0);
      const totalRec = (updatedItems as any[] || []).reduce((s: number, i: any) => s + i.quantity_received, 0);
      const newStatus = totalRec >= totalOrd ? "received" : totalRec > 0 ? "partial" : "pending";
      await supabase.from("purchase_orders" as any).update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", orderId);

      toast.success("Recepție înregistrată cu succes!");
      onBack();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><X className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Recepționare comandă #{orderId?.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">Introdu cantitățile recepționate fizic</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Comandat</TableHead>
                <TableHead>Deja recepționat</TableHead>
                <TableHead>Cantitate în recepția curentă</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : items.map((item: any) => {
                const remaining = item.quantity_ordered - item.quantity_received;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                          {item.product?.image_url ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{item.product?.name || item.product_name_snapshot}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{item.quantity_ordered}</TableCell>
                    <TableCell className="text-sm">{item.quantity_received}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        value={quantities[item.id] ?? ""}
                        onChange={(e) => setQty(item.id, Number(e.target.value))}
                        placeholder={`Max ${remaining}`}
                        className="w-28"
                        disabled={remaining <= 0}
                      />
                      {remaining <= 0 && <span className="text-xs text-green-600 ml-2">✓ Complet</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>Anulează</Button>
        <Button onClick={handleReceive} disabled={receiving}>
          {receiving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          Confirmă recepția
        </Button>
      </div>
    </div>
  );
}
