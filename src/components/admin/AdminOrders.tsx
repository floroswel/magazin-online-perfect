import { useState } from "react";
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
import {
  ChevronDown, ChevronRight, MapPin, CreditCard, Gift, Download, CalendarIcon,
  CheckCircle2, Truck, XCircle, RotateCcw, Eye, Package, Search, Ban
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "În așteptare", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: <Package className="w-3 h-3" /> },
  processing: { label: "În procesare", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  shipped: { label: "Expediat", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Livrat", color: "bg-green-500/15 text-green-600 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Anulat", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: "Rambursat", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: <RotateCcw className="w-3 h-3" /> },
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ order: any; action: string; label: string } | null>(null);
  const [actionNote, setActionNote] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url, slug))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, userEmail, order }: { id: string; status: string; userEmail?: string; order?: any }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;

      if (userEmail) {
        if (status === "shipped" && order) {
          // Send dedicated shipping update email with tracking info
          supabase.functions.invoke("send-email", {
            body: {
              type: "shipping_update",
              to: userEmail,
              data: {
                orderId: id,
                trackingNumber: order.tracking_number || "",
                courierName: order.courier_name || "",
                trackingUrl: order.tracking_url || "",
                shippingAddress: order.shipping_address || null,
                estimatedDelivery: order.estimated_delivery || "",
              },
            },
          }).catch(console.error);
        } else {
          supabase.functions.invoke("send-email", {
            body: { type: "order_status", to: userEmail, data: { orderId: id, status } },
          }).catch(console.error);
        }
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

  const filtered = orders.filter((o: any) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    const orderDate = new Date(o.created_at);
    if (dateFrom && orderDate < startOfDay(dateFrom)) return false;
    if (dateTo && orderDate > endOfDay(dateTo)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.id.toLowerCase().includes(q) &&
        !(o.user_email || "").toLowerCase().includes(q) &&
        !(o.shipping_address as any)?.full_name?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const kpis = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    processing: orders.filter((o: any) => o.status === "processing").length,
    revenue: orders.filter((o: any) => !["cancelled", "refunded"].includes(o.status)).reduce((s: number, o: any) => s + Number(o.total), 0),
  };

  const executeAction = (order: any, action: string) => {
    const statusMap: Record<string, string> = {
      mark_paid: "processing",
      fulfill: "shipped",
      deliver: "delivered",
      cancel: "cancelled",
      refund: "refunded",
    };
    const labels: Record<string, string> = {
      mark_paid: "Marchează ca plătită",
      fulfill: "Marchează ca expediată",
      deliver: "Marchează ca livrată",
      cancel: "Anulează comanda",
      refund: "Rambursează comanda",
    };
    if (["cancel", "refund"].includes(action)) {
      setConfirmAction({ order, action, label: labels[action] });
    } else {
      updateStatus.mutate({ id: order.id, status: statusMap[action], userEmail: order.user_email });
    }
  };

  const confirmExecute = () => {
    if (!confirmAction) return;
    const statusMap: Record<string, string> = { cancel: "cancelled", refund: "refunded" };
    updateStatus.mutate({
      id: confirmAction.order.id,
      status: statusMap[confirmAction.action],
      userEmail: confirmAction.order.user_email,
    });
  };

  const getActions = (order: any) => {
    const actions: { key: string; label: string; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[] = [];
    switch (order.status) {
      case "pending":
        actions.push({ key: "mark_paid", label: "Marchează plătit", icon: <CheckCircle2 className="w-4 h-4" />, variant: "default" });
        actions.push({ key: "cancel", label: "Anulează", icon: <Ban className="w-4 h-4" />, variant: "destructive" });
        break;
      case "processing":
        actions.push({ key: "fulfill", label: "Expediază", icon: <Truck className="w-4 h-4" />, variant: "default" });
        actions.push({ key: "cancel", label: "Anulează", icon: <Ban className="w-4 h-4" />, variant: "destructive" });
        break;
      case "shipped":
        actions.push({ key: "deliver", label: "Confirmă livrare", icon: <CheckCircle2 className="w-4 h-4" />, variant: "default" });
        break;
      case "delivered":
        actions.push({ key: "refund", label: "Rambursează", icon: <RotateCcw className="w-4 h-4" />, variant: "destructive" });
        break;
    }
    return actions;
  };

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Nu există comenzi de exportat."); return; }
    const rows: string[][] = [
      ["ID Comandă", "Data", "Client Email", "Status", "Total (RON)", "Discount (RON)", "Metoda Plată", "Puncte Fidelitate", "Produse", "Adresă Livrare"],
    ];
    filtered.forEach((order: any) => {
      const address = order.shipping_address as any;
      const items = (order.order_items || []).map((i: any) => `${i.products?.name || "Produs șters"} x${i.quantity}`).join("; ");
      const addr = address ? `${address.full_name}, ${address.address}, ${address.city}, ${address.county} ${address.postal_code || ""}, Tel: ${address.phone}` : "";
      rows.push([
        order.id, format(new Date(order.created_at), "yyyy-MM-dd HH:mm"), order.user_email || "",
        statusConfig[order.status]?.label || order.status, Number(order.total).toFixed(2),
        Number(order.discount_amount || 0).toFixed(2), order.payment_method || "ramburs",
        String(order.loyalty_points_earned || 0), items, addr,
      ]);
    });
    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comenzi-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} comenzi exportate!`);
  };

  const StatusChip = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground", icon: null };
    return (
      <Badge variant="outline" className={cn("gap-1 font-medium border", cfg.color)}>
        {cfg.icon} {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total comenzi</p>
          <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">În așteptare</p>
          <p className="text-2xl font-bold text-yellow-500">{kpis.pending}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">În procesare</p>
          <p className="text-2xl font-bold text-blue-500">{kpis.processing}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Venituri</p>
          <p className="text-2xl font-bold text-green-500">{kpis.revenue.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <CardTitle className="text-foreground">Comenzi ({filtered.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Caută ID, email, nume..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: ro }) : "De la"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4" />
                    {dateTo ? format(dateTo, "dd MMM yyyy", { locale: ro }) : "Până la"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>✕</Button>
              )}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filtrează status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-center">Articole</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order: any) => {
                  const address = order.shipping_address as any;
                  return (
                    <TableRow key={order.id} className="group">
                      <TableCell>
                        <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[180px]">{address?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{order.user_email || "—"}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm">{order.order_items?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold text-sm">{Number(order.total).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON</p>
                        {order.discount_amount > 0 && (
                          <p className="text-xs text-green-500">-{Number(order.discount_amount).toFixed(2)}</p>
                        )}
                      </TableCell>
                      <TableCell><StatusChip status={order.status} /></TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">{order.payment_method || "ramburs"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOrder(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {getActions(order).slice(0, 2).map((act) => (
                            <Button
                              key={act.key}
                              variant={act.variant === "destructive" ? "ghost" : "outline"}
                              size="sm"
                              className={cn("h-8 text-xs gap-1", act.variant === "destructive" && "text-destructive hover:text-destructive")}
                              onClick={() => executeAction(order, act.key)}
                            >
                              {act.icon}
                              <span className="hidden xl:inline">{act.label}</span>
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio comandă găsită.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailOrder && (() => {
            const address = detailOrder.shipping_address as any;
            const installments = detailOrder.payment_installments as any;
            const subtotal = (detailOrder.order_items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span>Comandă #{detailOrder.id.slice(0, 8)}</span>
                    <StatusChip status={detailOrder.status} />
                  </DialogTitle>
                  <DialogDescription>
                    {format(new Date(detailOrder.created_at), "dd MMMM yyyy, HH:mm", { locale: ro })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Items Table */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-foreground">Produse comandate</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produs</TableHead>
                          <TableHead className="text-center">Cant.</TableHead>
                          <TableHead className="text-right">Preț</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailOrder.order_items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {item.products?.image_url && (
                                  <img src={item.products.image_url} alt="" className="w-10 h-10 rounded object-cover border border-border" />
                                )}
                                <span className="text-sm font-medium">{item.products?.name || "Produs șters"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm">{Number(item.price).toFixed(2)} RON</TableCell>
                            <TableCell className="text-right font-medium">{(Number(item.price) * item.quantity).toFixed(2)} RON</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Totals */}
                    <div className="mt-3 border-t border-border pt-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{subtotal.toFixed(2)} RON</span></div>
                      {detailOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-500"><span>Discount</span><span>-{Number(detailOrder.discount_amount).toFixed(2)} RON</span></div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                        <span>Total</span><span>{Number(detailOrder.total).toFixed(2)} RON</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    {address && (
                      <Card className="bg-muted/30 border-border">
                        <CardContent className="p-4 space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-1 text-foreground"><MapPin className="w-4 h-4" /> Adresă livrare</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>{address.full_name}</p>
                            <p>{address.address}</p>
                            <p>{address.city}, {address.county} {address.postal_code}</p>
                            <p>📞 {address.phone}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Card className="bg-muted/30 border-border">
                      <CardContent className="p-4 space-y-1">
                        <h4 className="text-sm font-semibold flex items-center gap-1 text-foreground"><CreditCard className="w-4 h-4" /> Plată</h4>
                        <div className="text-sm text-muted-foreground">
                          <p className="capitalize">{detailOrder.payment_method || "Ramburs"}</p>
                          {installments && (
                            <p className="text-xs mt-1">{installments.months || installments.count} rate × {Number(installments.monthly_amount || installments.monthlyAmount || 0).toFixed(2)} RON via {installments.provider}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border">
                      <CardContent className="p-4 space-y-1">
                        <h4 className="text-sm font-semibold flex items-center gap-1 text-foreground"><Gift className="w-4 h-4" /> Extra</h4>
                        <div className="text-sm text-muted-foreground">
                          {detailOrder.loyalty_points_earned > 0 && <p>+{detailOrder.loyalty_points_earned} puncte</p>}
                          <p className="text-xs">Email: {detailOrder.user_email || "—"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions */}
                  {getActions(detailOrder).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      {getActions(detailOrder).map((act) => (
                        <Button
                          key={act.key}
                          variant={act.variant}
                          size="sm"
                          className="gap-2"
                          onClick={() => executeAction(detailOrder, act.key)}
                        >
                          {act.icon} {act.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Destructive Action */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction?.label}</DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "cancel"
                ? "Ești sigur că vrei să anulezi această comandă? Clientul va fi notificat."
                : "Ești sigur că vrei să rambursezi această comandă? Aceasta va marca comanda ca rambursată."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motiv (opțional)</Label>
            <Textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Adaugă un motiv..."
              rows={3}
            />
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
