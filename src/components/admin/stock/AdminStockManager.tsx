import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndNotifyBackInStock } from "@/lib/backInStockNotify";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Download, Upload, Package, History, Loader2, Image as ImageIcon, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface ProductStock {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  stock: number;
  low_stock_threshold: number | null;
  updated_at: string;
}

interface WarehouseInfo {
  id: string;
  name: string;
}

interface WarehouseStockRow {
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number | null;
}

export default function AdminStockManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState<string | null>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Multi-warehouse
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockRow[]>([]);

  const fetchWarehouses = useCallback(async () => {
    const { data } = await supabase.from("warehouses").select("id, name").eq("is_active", true).order("is_default", { ascending: false }).order("name");
    setWarehouses(data || []);
  }, []);

  const fetchWarehouseStock = useCallback(async () => {
    const { data } = await supabase.from("warehouse_stock").select("warehouse_id, product_id, quantity, reserved_quantity");
    setWarehouseStock((data as any[]) || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, image_url, stock, low_stock_threshold, updated_at")
      .order("name");
    if (!error && data) setProducts(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    fetchWarehouseStock();
  }, [fetchProducts, fetchWarehouses, fetchWarehouseStock]);

  const getWarehouseBreakdown = (productId: string) => {
    return warehouseStock.filter(ws => ws.product_id === productId);
  };

  const getDisplayStock = (p: ProductStock) => {
    if (selectedWarehouse === "all") return p.stock;
    const ws = warehouseStock.find(s => s.product_id === p.id && s.warehouse_id === selectedWarehouse);
    return ws?.quantity ?? 0;
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const stock = getDisplayStock(p);
    const threshold = p.low_stock_threshold ?? 5;
    if (filter === "low") return matchSearch && stock > 0 && stock <= threshold;
    if (filter === "out") return matchSearch && stock === 0;
    return matchSearch;
  });

  const lowCount = products.filter((p) => {
    const s = getDisplayStock(p);
    return s > 0 && s <= (p.low_stock_threshold ?? 5);
  }).length;
  const outCount = products.filter((p) => getDisplayStock(p) === 0).length;

  const saveInlineEdit = async (productId: string) => {
    const newStock = parseInt(editValue);
    if (isNaN(newStock) || newStock < 0) { toast.error("Valoare invalidă"); return; }
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (editWarehouseId && editWarehouseId !== "total") {
      // Edit per-warehouse stock
      const ws = warehouseStock.find(s => s.product_id === productId && s.warehouse_id === editWarehouseId);
      const oldVal = ws?.quantity ?? 0;

      if (ws) {
        await supabase.from("warehouse_stock").update({ quantity: newStock }).eq("warehouse_id", editWarehouseId).eq("product_id", productId);
      } else {
        await supabase.from("warehouse_stock").insert({ warehouse_id: editWarehouseId, product_id: productId, quantity: newStock });
      }

      // Update total stock on products
      const breakdown = getWarehouseBreakdown(productId);
      const totalFromWarehouses = breakdown.reduce((s, r) => s + (r.warehouse_id === editWarehouseId ? newStock : r.quantity), 0) + (ws ? 0 : newStock);
      await supabase.from("products").update({ stock: totalFromWarehouses }).eq("id", productId);

      await supabase.from("stock_change_log").insert({
        product_id: productId, sku: product.sku, old_value: oldVal, new_value: newStock,
        reason: "manual", changed_by: user?.id, notes: `Editare inline depozit`,
      });

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: totalFromWarehouses } : p));
      setWarehouseStock(prev => {
        const rest = prev.filter(s => !(s.product_id === productId && s.warehouse_id === editWarehouseId));
        return [...rest, { warehouse_id: editWarehouseId, product_id: productId, quantity: newStock, reserved_quantity: ws?.reserved_quantity ?? 0 }];
      });
    } else {
      // Edit total stock
      await supabase.from("stock_change_log").insert({
        product_id: productId, sku: product.sku, old_value: product.stock, new_value: newStock,
        reason: "manual", changed_by: user?.id, notes: "Editare inline din Stock Manager",
      });
      await supabase.from("products").update({ stock: newStock }).eq("id", productId);
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock: newStock } : p));
      checkAndNotifyBackInStock(productId, product.stock, newStock);
    }

    // Also check for warehouse-level restocks
    if (editWarehouseId && editWarehouseId !== "total") {
      checkAndNotifyBackInStock(productId, product.stock, products.find(p => p.id === productId)?.stock ?? newStock);
    }

    setEditingId(null);
    setEditWarehouseId(null);
    toast.success("Stoc actualizat!");
  };

  const downloadCSV = () => {
    const header = "SKU,Nume,Stoc,Prag_alertă\n";
    const rows = products.map((p) => `"${p.sku || ""}","${p.name}",${p.stock},${p.low_stock_threshold ?? 5}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV descărcat!");
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) { toast.error("Fișier gol"); return; }

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
    const skuIdx = headers.findIndex(h => h === "sku");
    const qtyIdx = headers.findIndex(h => h.includes("stock") || h.includes("quantity") || h.includes("cantitate") || h.includes("stoc"));
    if (skuIdx === -1 || qtyIdx === -1) { toast.error("CSV trebuie să conțină coloanele SKU și Stock/Quantity"); return; }

    let updated = 0, errors = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
      const sku = cols[skuIdx];
      const qty = parseInt(cols[qtyIdx]);
      if (!sku || isNaN(qty)) { errors++; continue; }

      const product = products.find((p) => p.sku === sku);
      if (!product) { errors++; continue; }

      await supabase.from("stock_change_log").insert({
        product_id: product.id, sku, old_value: product.stock, new_value: qty,
        reason: "import", changed_by: user?.id, notes: `Import CSV: ${file.name}`,
      });
      await supabase.from("products").update({ stock: qty }).eq("id", product.id);
      updated++;
    }

    toast.success(`${updated} produse actualizate, ${errors} erori`);
    fetchProducts();
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const openHistory = async (productId: string) => {
    setHistoryProductId(productId);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("stock_change_log")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const reasonLabels: Record<string, string> = {
    manual: "Editare manuală", import: "Import CSV/URL", order: "Comandă", return: "Retur", adjustment: "Ajustare",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manager Stocuri</h1>
          <p className="text-sm text-muted-foreground">Editare rapidă inline și import/export CSV</p>
        </div>
        <div className="flex gap-2">
          <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          <Button variant="outline" onClick={() => csvInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button variant="outline" onClick={downloadCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total produse</p><p className="text-2xl font-bold">{products.length}</p></div>
            {filter === "all" && <Badge>Activ</Badge>}
          </CardContent>
        </Card>
        <Card className="border-border cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilter("low")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Stoc scăzut</p><p className="text-2xl font-bold text-yellow-500">{lowCount}</p></div>
            {filter === "low" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
        <Card className="border-border cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setFilter("out")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Fără stoc</p><p className="text-2xl font-bold text-destructive">{outCount}</p></div>
            {filter === "out" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Search + Warehouse Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută după nume sau SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {warehouses.length > 0 && (
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[200px]">
              <Warehouse className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate depozitele</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stoc</TableHead>
                    {warehouses.length > 0 && selectedWarehouse === "all" && <TableHead>Per depozit</TableHead>}
                    <TableHead className="text-right">Prag alertă</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actualizat</TableHead>
                    <TableHead className="text-right">Istoric</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const displayStock = getDisplayStock(p);
                    const threshold = p.low_stock_threshold ?? 5;
                    const status = displayStock === 0 ? "out" : displayStock <= threshold ? "low" : "ok";
                    const breakdown = getWarehouseBreakdown(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.image_url ? (
                              <img src={p.image_url} className="w-8 h-8 rounded object-cover border border-border" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                            )}
                            <span className="text-sm font-medium truncate max-w-[200px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{p.sku || "—"}</TableCell>
                        <TableCell className="text-right">
                          {editingId === p.id && (!editWarehouseId || editWarehouseId === "total") ? (
                            <Input type="number" min="0" value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveInlineEdit(p.id); if (e.key === "Escape") setEditingId(null); }}
                              onBlur={() => saveInlineEdit(p.id)}
                              className="w-20 h-8 text-right text-sm ml-auto" autoFocus />
                          ) : (
                            <button onClick={() => { setEditingId(p.id); setEditWarehouseId("total"); setEditValue(String(displayStock)); }}
                              className="font-mono font-bold text-sm px-2 py-1 rounded hover:bg-muted transition-colors cursor-text">
                              {displayStock}
                            </button>
                          )}
                        </TableCell>
                        {warehouses.length > 0 && selectedWarehouse === "all" && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {warehouses.map(w => {
                                const ws = breakdown.find(b => b.warehouse_id === w.id);
                                const qty = ws?.quantity ?? 0;
                                const isEditingThis = editingId === p.id && editWarehouseId === w.id;
                                return (
                                  <Tooltip key={w.id}>
                                    <TooltipTrigger asChild>
                                      {isEditingThis ? (
                                        <Input type="number" min="0" value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={(e) => { if (e.key === "Enter") saveInlineEdit(p.id); if (e.key === "Escape") { setEditingId(null); setEditWarehouseId(null); }}}
                                          onBlur={() => saveInlineEdit(p.id)}
                                          className="w-16 h-6 text-xs text-center" autoFocus />
                                      ) : (
                                        <button onClick={() => { setEditingId(p.id); setEditWarehouseId(w.id); setEditValue(String(qty)); }}
                                          className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono cursor-text">
                                          {w.name.substring(0, 3)}: {qty}
                                        </button>
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent><p>{w.name}: {qty} buc</p></TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-right text-sm text-muted-foreground font-mono">{threshold}</TableCell>
                        <TableCell>
                          {status === "out" && <Badge variant="destructive">Epuizat</Badge>}
                          {status === "low" && <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">Scăzut</Badge>}
                          {status === "ok" && <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">OK</Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: ro })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openHistory(p.id)}>
                            <History className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={!!historyProductId} onOpenChange={(o) => !o && setHistoryProductId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Istoric modificări stoc</DialogTitle>
            <DialogDescription>{products.find((p) => p.id === historyProductId)?.name}</DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nicio modificare înregistrată.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 text-sm border border-border rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        <span className="text-destructive">{h.old_value}</span>{" → "}<span className="text-green-600 dark:text-green-400">{h.new_value}</span>
                      </span>
                      <Badge variant="outline" className="text-xs">{reasonLabels[h.reason] || h.reason}</Badge>
                    </div>
                    {h.notes && <p className="text-xs text-muted-foreground mt-1">{h.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ro })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
