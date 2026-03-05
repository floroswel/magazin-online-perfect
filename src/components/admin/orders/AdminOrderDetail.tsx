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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, CreditCard, Gift, CheckCircle2, Truck, XCircle,
  RotateCcw, Package, Ban, StickyNote, Clock, Copy, FileText, Plus, Minus,
  Tag, Pencil, Save, Printer, Send,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "În așteptare", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: <Package className="w-3 h-3" /> },
  processing: { label: "În procesare", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  shipped: { label: "Expediat", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Livrat", color: "bg-green-500/15 text-green-600 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Anulat", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: "Rambursat", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: <RotateCcw className="w-3 h-3" /> },
};

interface Props {
  orderId: string;
  onBack: () => void;
}

export default function AdminOrderDetail({ orderId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [internalNote, setInternalNote] = useState("");
  const [editAddress, setEditAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [sendEmailOnStatus, setSendEmailOnStatus] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, image_url, slug, sku, stock, price))")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["order-timeline", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("order_timeline").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const { data: orderTags = [] } = useQuery({
    queryKey: ["order-detail-tags", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("order_tag_assignments").select("*, order_tags(*)").eq("order_id", orderId);
      return (data as any[]) || [];
    },
  });

  // ─── Mutations ───
  const changeStatus = async () => {
    if (!newStatus || !order) return;
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    await supabase.from("order_timeline").insert({
      order_id: orderId, action: "status_change", old_status: order.status, new_status: newStatus, note: statusNote || null,
    });
    if (sendEmailOnStatus && order.user_email) {
      supabase.functions.invoke("send-email", {
        body: { type: "order_status", to: order.user_email, data: { orderId, status: newStatus } },
      }).catch(console.error);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success(`Status schimbat la ${statusConfig[newStatus]?.label || newStatus}`);
    setShowStatusDialog(false);
    setStatusNote("");
  };

  const addInternalNote = async () => {
    if (!internalNote.trim()) return;
    await supabase.from("order_timeline").insert({
      order_id: orderId, action: "note", note: internalNote, is_internal: true,
    });
    // Also save to internal_notes field
    const current = order?.internal_notes || "";
    const updated = current ? `${current}\n[${format(new Date(), "dd.MM.yy HH:mm")}] ${internalNote}` : `[${format(new Date(), "dd.MM.yy HH:mm")}] ${internalNote}`;
    await supabase.from("orders").update({ internal_notes: updated }).eq("id", orderId);
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    toast.success("Notă adăugată");
    setInternalNote("");
  };

  const saveAddress = async () => {
    if (!addressDraft) return;
    await supabase.from("orders").update({ shipping_address: addressDraft }).eq("id", orderId);
    await supabase.from("order_timeline").insert({ order_id: orderId, action: "address_edit", note: "Adresă de livrare modificată" });
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    toast.success("Adresă actualizată");
    setEditAddress(false);
  };

  const duplicateOrder = async () => {
    if (!order) return;
    const { data: newOrder } = await supabase.from("orders").insert({
      user_id: order.user_id, user_email: order.user_email, total: order.total,
      status: "pending", payment_method: order.payment_method,
      shipping_address: order.shipping_address, billing_address: order.billing_address,
      notes: `Duplicat din comanda #${order.order_number || order.id.slice(0, 8)}`,
      subtotal: order.subtotal, shipping_total: order.shipping_total,
    }).select().single();

    if (newOrder && order.order_items) {
      const items = order.order_items.map((i: any) => ({
        order_id: newOrder.id, product_id: i.product_id, variant_id: i.variant_id,
        quantity: i.quantity, price: i.price,
      }));
      await supabase.from("order_items").insert(items);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Comandă duplicată cu succes!");
  };

  const processRefund = async () => {
    if (!order) return;
    const amount = refundAmount ? Number(refundAmount) : Number(order.total);
    const isPartial = amount < Number(order.total);

    await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
    await supabase.from("order_timeline").insert({
      order_id: orderId, action: "refund",
      note: `${isPartial ? "Rambursare parțială" : "Rambursare completă"}: ${amount.toFixed(2)} RON. Motiv: ${refundReason || "—"}`,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success(`Rambursare de ${amount.toFixed(2)} RON procesată`);
    setShowRefundDialog(false);
  };

  const updateItemQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    await supabase.from("order_items").update({ quantity: newQty }).eq("id", itemId);
    // Recalculate total
    const items = order?.order_items?.map((i: any) => i.id === itemId ? { ...i, quantity: newQty } : i) || [];
    const newTotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    await supabase.from("orders").update({ total: newTotal, subtotal: newTotal }).eq("id", orderId);
    await supabase.from("order_timeline").insert({ order_id: orderId, action: "edit", note: `Cantitate modificată pentru articol` });
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    toast.success("Cantitate actualizată");
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("order_items").delete().eq("id", itemId);
    const remaining = order?.order_items?.filter((i: any) => i.id !== itemId) || [];
    const newTotal = remaining.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    await supabase.from("orders").update({ total: newTotal, subtotal: newTotal }).eq("id", orderId);
    await supabase.from("order_timeline").insert({ order_id: orderId, action: "edit", note: "Produs eliminat din comandă" });
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
    toast.success("Produs eliminat");
  };

  if (isLoading || !order) {
    return <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>;
  }

  const addr = order.shipping_address as any;
  const billing = order.billing_address as any;
  const subtotal = (order.order_items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
  const StatusChip = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground", icon: null };
    return <Badge variant="outline" className={cn("gap-1 font-medium border", cfg.color)}>{cfg.icon} {cfg.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Comandă #{order.order_number || order.id.slice(0, 8)}</h1>
              <StatusChip status={order.status} />
              {orderTags.map((ta: any) => (
                <Badge key={ta.id} variant="outline" className="text-[10px]" style={{ borderColor: ta.order_tags?.color, color: ta.order_tags?.color }}>
                  {ta.order_tags?.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMMM yyyy, HH:mm", { locale: ro })} · {order.user_email}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setShowStatusDialog(true)}><Pencil className="w-3.5 h-3.5 mr-1" />Status</Button>
          <Button variant="outline" size="sm" onClick={duplicateOrder}><Copy className="w-3.5 h-3.5 mr-1" />Duplică</Button>
          {!["cancelled", "refunded"].includes(order.status) && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setRefundAmount(String(order.total)); setShowRefundDialog(true); }}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />Ramburs
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ─── Left Column: Products + Totals ─── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Produse comandate</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Preț</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {["pending", "processing"].includes(order.status) && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.products?.image_url && <img src={item.products.image_url} alt="" className="w-9 h-9 rounded object-cover border" />}
                          <span className="text-sm">{item.products?.name || "Produs șters"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{item.products?.sku || "—"}</TableCell>
                      <TableCell className="text-center">
                        {["pending", "processing"].includes(order.status) ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{Number(item.price).toFixed(2)} RON</TableCell>
                      <TableCell className="text-right font-medium">{(Number(item.price) * item.quantity).toFixed(2)} RON</TableCell>
                      {["pending", "processing"].includes(order.status) && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{subtotal.toFixed(2)} RON</span></div>
                {Number(order.shipping_total) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span>{Number(order.shipping_total).toFixed(2)} RON</span></div>}
                {Number(order.discount_amount || order.discount_total) > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-{Number(order.discount_amount || order.discount_total).toFixed(2)} RON</span></div>}
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{Number(order.total).toFixed(2)} RON</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Timeline</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {timeline.map((t: any) => (
                    <div key={t.id} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {t.action === "status_change" ? `Status: ${statusConfig[t.old_status]?.label || t.old_status || "—"} → ${statusConfig[t.new_status]?.label || t.new_status}` :
                             t.action === "note" ? "Notă internă" :
                             t.action === "refund" ? "Rambursare" :
                             t.action === "edit" ? "Editare comandă" :
                             t.action === "address_edit" ? "Editare adresă" : t.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd.MM.yy HH:mm")}</span>
                        </div>
                        {t.note && <p className="text-xs text-muted-foreground mt-0.5">{t.note}</p>}
                      </div>
                    </div>
                  ))}
                  {/* Initial order creation */}
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-xs font-medium">Comandă creată</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(order.created_at), "dd.MM.yy HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> Note interne</CardTitle></CardHeader>
            <CardContent>
              {order.internal_notes && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap mb-3 bg-muted/30 p-2 rounded">{order.internal_notes}</pre>
              )}
              <div className="flex gap-2">
                <Textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Adaugă notă internă (vizibilă doar staff)..." rows={2} className="text-xs" />
                <Button size="sm" onClick={addInternalNote} disabled={!internalNote.trim()} className="shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1" />Adaugă
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column: Info cards ─── */}
        <div className="space-y-4">
          {/* Customer notes */}
          {order.notes && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold flex items-center gap-1 mb-1">💬 Notă client</h4>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Delivery address */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Adresă livrare</h4>
                {["pending", "processing"].includes(order.status) && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setAddressDraft(addr ? { ...addr } : {}); setEditAddress(true); }}>
                    <Pencil className="w-3 h-3 mr-1" />Edit
                  </Button>
                )}
              </div>
              {addr ? (
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{addr.full_name}</p>
                  <p>{addr.address}</p>
                  <p>{addr.city}, {addr.county} {addr.postal_code || ""}</p>
                  <p>📞 {addr.phone}</p>
                </div>
              ) : <p className="text-xs text-muted-foreground">—</p>}
            </CardContent>
          </Card>

          {/* Billing address */}
          {billing && (
            <Card>
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold flex items-center gap-1 mb-2"><FileText className="w-3.5 h-3.5" /> Adresă facturare</h4>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{billing.full_name || billing.company_name}</p>
                  <p>{billing.address}</p>
                  <p>{billing.city}, {billing.county}</p>
                  {billing.cui && <p>CUI: {billing.cui}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold flex items-center gap-1 mb-2"><CreditCard className="w-3.5 h-3.5" /> Plată</h4>
              <div className="text-sm text-muted-foreground">
                <p className="capitalize font-medium text-foreground">{order.payment_method || "Ramburs"}</p>
                <p className="text-xs">Status: {order.payment_status || "—"}</p>
                {order.payment_installments && (
                  <p className="text-xs mt-1">{(order.payment_installments as any).months || (order.payment_installments as any).count} rate via {(order.payment_installments as any).provider}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold flex items-center gap-1 mb-2"><Truck className="w-3.5 h-3.5" /> Livrare</h4>
              <div className="text-sm text-muted-foreground">
                <p>Status: {order.shipping_status || "—"}</p>
                {order.fulfillment_warehouse_id && <p className="text-xs">Depozit: {order.fulfillment_warehouse_id.slice(0, 8)}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Extra */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold flex items-center gap-1 mb-2"><Gift className="w-3.5 h-3.5" /> Extra</h4>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {order.loyalty_points_earned > 0 && <p>+{order.loyalty_points_earned} puncte fidelitate</p>}
                {order.source && <p>Sursă: {order.source}</p>}
                <p className="text-xs">ID: {order.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Status change dialog ─── */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schimbă status comandă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Status nou</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Selectează status" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notă (opțional)</Label>
              <Textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Motiv schimbare..." rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sendEmailOnStatus} onCheckedChange={setSendEmailOnStatus} />
              <Label className="text-sm">Trimite email notificare clientului</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Anulează</Button>
            <Button onClick={changeStatus} disabled={!newStatus}><Send className="w-3.5 h-3.5 mr-1" />Schimbă status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit address dialog ─── */}
      <Dialog open={editAddress} onOpenChange={setEditAddress}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editare adresă livrare</DialogTitle></DialogHeader>
          {addressDraft && (
            <div className="space-y-3">
              {[{ key: "full_name", label: "Nume complet" }, { key: "phone", label: "Telefon" }, { key: "address", label: "Adresă" }, { key: "city", label: "Oraș" }, { key: "county", label: "Județ" }, { key: "postal_code", label: "Cod poștal" }].map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input value={addressDraft[f.key] || ""} onChange={e => setAddressDraft({ ...addressDraft, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAddress(false)}>Anulează</Button>
            <Button onClick={saveAddress}><Save className="w-3.5 h-3.5 mr-1" />Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Refund dialog ─── */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rambursare comandă</DialogTitle>
            <DialogDescription>Total comandă: {Number(order.total).toFixed(2)} RON</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sumă de rambursat (RON)</Label>
              <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} max={Number(order.total)} step="0.01" />
              <div className="flex gap-2 mt-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setRefundAmount(String(order.total))}>Ramburs complet</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setRefundAmount(String((Number(order.total) / 2).toFixed(2)))}>50%</Button>
              </div>
            </div>
            <div>
              <Label>Motiv rambursare</Label>
              <Textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="De ce se rambursează..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Anulează</Button>
            <Button variant="destructive" onClick={processRefund}><RotateCcw className="w-3.5 h-3.5 mr-1" />Procesează rambursare</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
