import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronDown, ChevronRight, MapPin, CreditCard, Gift, Download, CalendarIcon,
  CheckCircle2, Truck, XCircle, RotateCcw, Eye, Package, Search, Ban,
  Tag, Plus, FileText, Copy, StickyNote, Clock, ArrowUpDown, Printer,
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AdminOrderDetail from "./orders/AdminOrderDetail";

const DEFAULT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "În așteptare", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: <Package className="w-3 h-3" /> },
  processing: { label: "În procesare", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  shipped: { label: "Expediat", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Livrat", color: "bg-green-500/15 text-green-600 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Anulat", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: "Rambursat", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: <RotateCcw className="w-3 h-3" /> },
};

export { DEFAULT_STATUS_CONFIG as statusConfig };

type SortKey = "date" | "total" | "status" | "customer";
type SortDir = "asc" | "desc";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ order: any; action: string; label: string } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [showTagDialog, setShowTagDialog] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [showFilters, setShowFilters] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url, slug, sku))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ["order-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("order_tags").select("*").order("name");
      return (data as any[]) || [];
    },
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ["order-tag-assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("order_tag_assignments").select("*");
      return (data as any[]) || [];
    },
  });

  const orderTagMap = useMemo(() => {
    const m = new Map<string, string[]>();
    tagAssignments.forEach((a: any) => {
      const arr = m.get(a.order_id) || [];
      arr.push(a.tag_id);
      m.set(a.order_id, arr);
    });
    return m;
  }, [tagAssignments]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, userEmail, order, sendEmail = true }: { id: string; status: string; userEmail?: string; order?: any; sendEmail?: boolean }) => {
      const oldOrder = orders.find((o: any) => o.id === id);
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;

      // Log timeline
      await supabase.from("order_timeline").insert({
        order_id: id,
        action: "status_change",
        old_status: oldOrder?.status || null,
        new_status: status,
        note: actionNote || null,
        is_internal: true,
      });

      if (sendEmail && userEmail) {
        supabase.functions.invoke("send-email", {
          body: { type: "order_status", to: userEmail, data: { orderId: id, status } },
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status actualizat!");
      setConfirmAction(null);
      setActionNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Filtering ───
  const filtered = useMemo(() => {
    let result = orders.filter((o: any) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterPayment !== "all" && (o.payment_method || "ramburs") !== filterPayment) return false;
      const d = new Date(o.created_at);
      if (dateFrom && d < startOfDay(dateFrom)) return false;
      if (dateTo && d > endOfDay(dateTo)) return false;
      if (minValue && Number(o.total) < Number(minValue)) return false;
      if (maxValue && Number(o.total) > Number(maxValue)) return false;
      if (filterTag !== "all") {
        const tIds = orderTagMap.get(o.id) || [];
        if (!tIds.includes(filterTag)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const addr = o.shipping_address as any;
        if (
          !o.id.toLowerCase().includes(q) &&
          !(o.order_number || "").toLowerCase().includes(q) &&
          !(o.user_email || "").toLowerCase().includes(q) &&
          !(addr?.full_name || "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortKey) {
        case "date": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case "total": cmp = Number(a.total) - Number(b.total); break;
        case "status": cmp = (a.status || "").localeCompare(b.status || ""); break;
        case "customer": {
          const na = (a.shipping_address as any)?.full_name || "";
          const nb = (b.shipping_address as any)?.full_name || "";
          cmp = na.localeCompare(nb);
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [orders, filterStatus, filterPayment, filterTag, dateFrom, dateTo, minValue, maxValue, search, sortKey, sortDir, orderTagMap]);

  const kpis = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    processing: orders.filter((o: any) => o.status === "processing").length,
    revenue: orders.filter((o: any) => !["cancelled", "refunded"].includes(o.status)).reduce((s: number, o: any) => s + Number(o.total), 0),
  };

  const paymentMethods = useMemo(() => [...new Set(orders.map((o: any) => o.payment_method || "ramburs"))], [orders]);

  // ─── Actions ───
  const executeAction = (order: any, action: string) => {
    const statusMap: Record<string, string> = { mark_paid: "processing", fulfill: "shipped", deliver: "delivered", cancel: "cancelled", refund: "refunded" };
    const labels: Record<string, string> = { mark_paid: "Marchează ca plătită", fulfill: "Marchează ca expediată", deliver: "Marchează ca livrată", cancel: "Anulează comanda", refund: "Rambursează comanda" };
    if (["cancel", "refund"].includes(action)) {
      setConfirmAction({ order, action, label: labels[action] });
    } else {
      updateStatus.mutate({ id: order.id, status: statusMap[action], userEmail: order.user_email, order });
    }
  };

  const confirmExecute = () => {
    if (!confirmAction) return;
    const statusMap: Record<string, string> = { cancel: "cancelled", refund: "refunded" };
    updateStatus.mutate({ id: confirmAction.order.id, status: statusMap[confirmAction.action], userEmail: confirmAction.order.user_email, order: confirmAction.order });
  };

  const getActions = (order: any) => {
    const actions: { key: string; label: string; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[] = [];
    switch (order.status) {
      case "pending":
        actions.push({ key: "mark_paid", label: "Plătit", icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: "default" });
        actions.push({ key: "cancel", label: "Anulează", icon: <Ban className="w-3.5 h-3.5" />, variant: "destructive" });
        break;
      case "processing":
        actions.push({ key: "fulfill", label: "Expediază", icon: <Truck className="w-3.5 h-3.5" />, variant: "default" });
        actions.push({ key: "cancel", label: "Anulează", icon: <Ban className="w-3.5 h-3.5" />, variant: "destructive" });
        break;
      case "shipped":
        actions.push({ key: "deliver", label: "Livrat", icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: "default" });
        break;
      case "delivered":
        actions.push({ key: "refund", label: "Ramburs", icon: <RotateCcw className="w-3.5 h-3.5" />, variant: "destructive" });
        break;
    }
    return actions;
  };

  // ─── Bulk actions ───
  const allSelected = filtered.length > 0 && filtered.every((o: any) => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((o: any) => o.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkChangeStatus = async (newStatus: string) => {
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("orders").update({ status: newStatus }).eq("id", id);
      await supabase.from("order_timeline").insert({ order_id: id, action: "status_change", new_status: newStatus, note: "Bulk update" });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success(`${ids.length} comenzi actualizate la ${statusConfig[newStatus]?.label || newStatus}`);
    setSelectedIds(new Set());
  };

  // ─── Tags ───
  const assignTag = async (orderId: string, tagId: string) => {
    await supabase.from("order_tag_assignments").insert({ order_id: orderId, tag_id: tagId });
    queryClient.invalidateQueries({ queryKey: ["order-tag-assignments"] });
  };

  const removeTag = async (orderId: string, tagId: string) => {
    await supabase.from("order_tag_assignments").delete().eq("order_id", orderId).eq("tag_id", tagId);
    queryClient.invalidateQueries({ queryKey: ["order-tag-assignments"] });
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    await supabase.from("order_tags").insert({ name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    queryClient.invalidateQueries({ queryKey: ["order-tags"] });
    toast.success("Tag creat!");
  };

  // ─── Export ───
  const exportCSV = () => {
    const source = someSelected ? filtered.filter((o: any) => selectedIds.has(o.id)) : filtered;
    if (source.length === 0) { toast.error("Nimic de exportat."); return; }
    const rows: string[][] = [["ID", "Nr.", "Data", "Client", "Email", "Status", "Total", "Plată", "Produse", "Adresă"]];
    source.forEach((o: any) => {
      const addr = o.shipping_address as any;
      const items = (o.order_items || []).map((i: any) => `${i.products?.name || "?"} x${i.quantity}`).join("; ");
      rows.push([o.id.slice(0, 8), o.order_number || "", format(new Date(o.created_at), "yyyy-MM-dd HH:mm"), addr?.full_name || "", o.user_email || "", statusConfig[o.status]?.label || o.status, Number(o.total).toFixed(2), o.payment_method || "ramburs", items, addr ? `${addr.address}, ${addr.city}` : ""]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `comenzi-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    toast.success(`${source.length} comenzi exportate!`);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHeader = ({ label, sk }: { label: string; sk: SortKey }) => (
    <button className="flex items-center gap-1 text-xs font-medium hover:text-foreground" onClick={() => toggleSort(sk)}>
      {label} <ArrowUpDown className={cn("w-3 h-3", sortKey === sk ? "text-primary" : "text-muted-foreground/40")} />
    </button>
  );

  const StatusChip = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground", icon: null };
    return <Badge variant="outline" className={cn("gap-1 font-medium border text-[11px]", cfg.color)}>{cfg.icon} {cfg.label}</Badge>;
  };

  // ─── Render detail page ───
  if (detailOrderId) {
    return <AdminOrderDetail orderId={detailOrderId} onBack={() => setDetailOrderId(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-5 pb-4"><p className="text-xs text-muted-foreground">Total comenzi</p><p className="text-2xl font-bold">{kpis.total}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xs text-muted-foreground">În așteptare</p><p className="text-2xl font-bold text-yellow-500">{kpis.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xs text-muted-foreground">În procesare</p><p className="text-2xl font-bold text-blue-500">{kpis.processing}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xs text-muted-foreground">Venituri</p><p className="text-2xl font-bold text-green-500">{kpis.revenue.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Comenzi ({filtered.length})</CardTitle>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Search className="w-3.5 h-3.5 mr-1" />Filtre {showFilters ? "▲" : "▼"}
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-3.5 h-3.5 mr-1" />{someSelected ? `Export (${selectedIds.size})` : "Export"}
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="ID, email, nume..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate statusurile</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Plată" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate plățile</SelectItem>
                    {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tag-urile</SelectItem>
                    {allTags.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="w-3 h-3" />{dateFrom ? format(dateFrom, "dd.MM.yy") : "De la"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-3 h-3" />{dateTo ? format(dateTo, "dd.MM.yy") : "Până la"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
                <Input type="number" placeholder="Min RON" value={minValue} onChange={e => setMinValue(e.target.value)} className="w-[90px] h-8 text-xs" />
                <Input type="number" placeholder="Max RON" value={maxValue} onChange={e => setMaxValue(e.target.value)} className="w-[90px] h-8 text-xs" />
                {(dateFrom || dateTo || minValue || maxValue || filterStatus !== "all" || filterPayment !== "all" || filterTag !== "all" || search) && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setMinValue(""); setMaxValue(""); setFilterStatus("all"); setFilterPayment("all"); setFilterTag("all"); setSearch(""); }}>✕ Reset</Button>
                )}
              </div>
            )}

            {/* Bulk actions bar */}
            {someSelected && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-xs font-medium">{selectedIds.size} selectate</span>
                <Select onValueChange={v => bulkChangeStatus(v)}>
                  <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue placeholder="Schimbă status" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportCSV}><Download className="w-3 h-3 mr-1" />Export CSV</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>Deselectează</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead><SortHeader label="Comandă" sk="date" /></TableHead>
                  <TableHead><SortHeader label="Client" sk="customer" /></TableHead>
                  <TableHead className="text-center">Produse</TableHead>
                  <TableHead className="text-right"><SortHeader label="Total" sk="total" /></TableHead>
                  <TableHead><SortHeader label="Status" sk="status" /></TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead>Tag-uri</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order: any) => {
                  const addr = order.shipping_address as any;
                  const isExpanded = expandedRow === order.id;
                  const oTags = (orderTagMap.get(order.id) || []).map((tid: string) => allTags.find((t: any) => t.id === tid)).filter(Boolean);

                  return (
                    <>
                      <TableRow key={order.id} className={cn("group cursor-pointer", isExpanded && "bg-muted/30")}>
                        <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} /></TableCell>
                        <TableCell onClick={() => setExpandedRow(isExpanded ? null : order.id)}>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </TableCell>
                        <TableCell onClick={() => setExpandedRow(isExpanded ? null : order.id)}>
                          <p className="font-mono text-xs text-muted-foreground">#{order.order_number || order.id.slice(0, 8)}</p>
                          <p className="text-[11px] text-muted-foreground">{format(new Date(order.created_at), "dd MMM yy, HH:mm", { locale: ro })}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[160px]">{addr?.full_name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{order.user_email || "—"}</p>
                        </TableCell>
                        <TableCell className="text-center text-sm">{order.order_items?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-sm">{Number(order.total).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON</p>
                        </TableCell>
                        <TableCell><StatusChip status={order.status} /></TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">{order.payment_method || "ramburs"}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5 flex-wrap">
                            {oTags.map((t: any) => (
                              <Badge key={t.id} variant="outline" className="text-[9px] px-1.5 py-0 border" style={{ borderColor: t.color, color: t.color }}>{t.name}</Badge>
                            ))}
                            <button className="text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowTagDialog(order.id); }}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailOrderId(order.id)}><Eye className="w-3.5 h-3.5" /></Button>
                            {getActions(order).slice(0, 1).map(act => (
                              <Button key={act.key} variant={act.variant === "destructive" ? "ghost" : "outline"} size="sm" className={cn("h-7 text-[11px] gap-1 px-2", act.variant === "destructive" && "text-destructive")} onClick={() => executeAction(order, act.key)}>
                                {act.icon}<span className="hidden xl:inline">{act.label}</span>
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Inline expand */}
                      {isExpanded && (
                        <TableRow key={`${order.id}-exp`}>
                          <TableCell colSpan={10} className="bg-muted/20 p-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">PRODUSE</h4>
                                {order.order_items?.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-2 mb-1">
                                    {item.products?.image_url && <img src={item.products.image_url} alt="" className="w-7 h-7 rounded object-cover border" />}
                                    <div className="min-w-0">
                                      <p className="text-xs truncate">{item.products?.name || "—"}</p>
                                      <p className="text-[10px] text-muted-foreground">{item.quantity}× {Number(item.price).toFixed(2)} RON</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">ADRESĂ LIVRARE</h4>
                                {addr ? (
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p>{addr.full_name}</p><p>{addr.address}</p>
                                    <p>{addr.city}, {addr.county} {addr.postal_code || ""}</p>
                                    <p>📞 {addr.phone}</p>
                                  </div>
                                ) : <p className="text-xs text-muted-foreground">—</p>}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">NOTE</h4>
                                <p className="text-xs text-muted-foreground">{order.notes || "Fără note de la client."}</p>
                                {order.internal_notes && <p className="text-xs mt-1 text-primary/70 italic">📝 {order.internal_notes}</p>}
                                <Button size="sm" variant="outline" className="mt-2 h-6 text-[10px]" onClick={() => setDetailOrderId(order.id)}>
                                  Deschide detalii →
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nicio comandă găsită.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tag assignment dialog */}
      <Dialog open={!!showTagDialog} onOpenChange={() => setShowTagDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Tag-uri comandă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {allTags.map((t: any) => {
              const isAssigned = (orderTagMap.get(showTagDialog || "") || []).includes(t.id);
              return (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={isAssigned} onCheckedChange={v => v ? assignTag(showTagDialog!, t.id) : removeTag(showTagDialog!, t.id)} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </label>
              );
            })}
            <div className="border-t pt-2 flex gap-1.5">
              <Input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Tag nou..." className="h-7 text-xs flex-1" />
              <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-7 h-7 rounded border cursor-pointer" />
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={createTag} disabled={!newTagName.trim()}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm destructive action */}
      <Dialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction?.label}</DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "cancel" ? "Clientul va fi notificat despre anulare." : "Comanda va fi marcată ca rambursată."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motiv (opțional)</Label>
            <Textarea value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Adaugă motiv..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Renunță</Button>
            <Button variant="destructive" onClick={confirmExecute} disabled={updateStatus.isPending}>
              {confirmAction?.action === "cancel" ? "Anulează comanda" : "Confirmă rambursarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
