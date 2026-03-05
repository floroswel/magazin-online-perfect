import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, Search, Eye, Download, Send, Trash2,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Clock,
  Copy, Building2, Receipt, FileCode, Printer, Ban,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// ─── Status config ───
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Ciornă", color: "bg-muted text-muted-foreground", icon: <Clock className="w-3 h-3" /> },
  issued: { label: "Emisă", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: <FileText className="w-3 h-3" /> },
  sent: { label: "Trimisă", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: <Send className="w-3 h-3" /> },
  paid: { label: "Plătită", color: "bg-green-500/15 text-green-600 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  overdue: { label: "Restantă", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled: { label: "Anulată", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  storno: { label: "Stornată", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: <Ban className="w-3 h-3" /> },
};

const efacturaStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "De trimis", color: "bg-yellow-500/15 text-yellow-600" },
  uploaded: { label: "Încărcat SPV", color: "bg-blue-500/15 text-blue-600" },
  accepted: { label: "Acceptat ANAF", color: "bg-green-500/15 text-green-600" },
  rejected: { label: "Respins ANAF", color: "bg-red-500/15 text-red-600" },
};

interface InvoiceItemForm {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

const emptyItem: InvoiceItemForm = { description: "", quantity: 1, unit_price: 0, vat_rate: 19 };

interface InvoiceForm {
  series: string;
  type: string;
  seller_name: string;
  seller_cui: string;
  seller_reg_com: string;
  seller_address: string;
  seller_bank: string;
  seller_iban: string;
  buyer_name: string;
  buyer_cui: string;
  buyer_address: string;
  buyer_email: string;
  buyer_phone: string;
  vat_rate: number;
  currency: string;
  notes: string;
  items: InvoiceItemForm[];
}

const defaultSellerFromSettings = {
  series: "MG",
  type: "invoice",
  seller_name: "",
  seller_cui: "",
  seller_reg_com: "",
  seller_address: "",
  seller_bank: "",
  seller_iban: "",
  buyer_name: "",
  buyer_cui: "",
  buyer_address: "",
  buyer_email: "",
  buyer_phone: "",
  vat_rate: 19,
  currency: "RON",
  notes: "",
  items: [{ ...emptyItem }],
};

export default function AdminInvoices() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceForm>({ ...defaultSellerFromSettings });
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [fromOrderDialog, setFromOrderDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  // ─── Queries ───
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["admin-invoices", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, user_email, shipping_address, created_at, status")
        .in("status", ["processing", "shipped", "delivered"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["app-settings-invoice"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["company_name", "company_cui", "company_reg_com", "company_address", "company_bank", "company_iban", "invoice_series"]);
      const map: Record<string, any> = {};
      data?.forEach((s: any) => { map[s.key] = s.value_json; });
      return map;
    },
  });

  // ─── Next invoice number ───
  const getNextInvoiceNumber = async (series: string) => {
    const { data } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("series", series)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      const lastNum = data[0].invoice_number;
      const match = lastNum.match(/(\d+)$/);
      if (match) {
        const next = parseInt(match[1]) + 1;
        return `${series}-${new Date().getFullYear()}-${String(next).padStart(5, "0")}`;
      }
    }
    return `${series}-${new Date().getFullYear()}-00001`;
  };

  // ─── Mutations ───
  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceForm & { id?: string }) => {
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const vatAmount = data.items.reduce((s, i) => s + i.quantity * i.unit_price * (i.vat_rate / 100), 0);
      const total = subtotal + vatAmount;
      const invoiceNumber = data.id
        ? undefined
        : await getNextInvoiceNumber(data.series);

      const payload: any = {
        series: data.series,
        type: data.type,
        seller_name: data.seller_name,
        seller_cui: data.seller_cui,
        seller_reg_com: data.seller_reg_com,
        seller_address: data.seller_address,
        seller_bank: data.seller_bank,
        seller_iban: data.seller_iban,
        buyer_name: data.buyer_name,
        buyer_cui: data.buyer_cui,
        buyer_address: data.buyer_address,
        buyer_email: data.buyer_email,
        buyer_phone: data.buyer_phone,
        vat_rate: data.vat_rate,
        currency: data.currency,
        notes: data.notes,
        subtotal,
        vat_amount: vatAmount,
        total,
        status: "draft",
      };

      if (data.id) {
        const { error } = await supabase.from("invoices").update(payload).eq("id", data.id);
        if (error) throw error;
        // Update items
        await supabase.from("invoice_items").delete().eq("invoice_id", data.id);
        const items = data.items.map((item, i) => ({
          invoice_id: data.id!,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          vat_amount: item.quantity * item.unit_price * (item.vat_rate / 100),
          total: item.quantity * item.unit_price * (1 + item.vat_rate / 100),
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
        if (itemsErr) throw itemsErr;
      } else {
        payload.invoice_number = invoiceNumber;
        payload.issued_at = new Date().toISOString();
        const { data: inv, error } = await supabase.from("invoices").insert(payload).select().single();
        if (error) throw error;
        const items = data.items.map((item, i) => ({
          invoice_id: inv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          vat_amount: item.quantity * item.unit_price * (item.vat_rate / 100),
          total: item.quantity * item.unit_price * (1 + item.vat_rate / 100),
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      setDialogOpen(false);
      setEditingId(null);
      toast.success(editingId ? "Factură actualizată!" : "Factură creată!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Status actualizat!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Factură ștearsă!");
    },
  });

  // ─── Generate from order ───
  const generateFromOrder = async (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) return;

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*, products(name)")
      .eq("order_id", orderId);

    const items: InvoiceItemForm[] = (orderItems || []).map((oi: any) => ({
      description: oi.products?.name || "Produs",
      quantity: oi.quantity,
      unit_price: oi.price,
      vat_rate: 19,
    }));

    const addr = order.shipping_address as any;
    setForm({
      ...defaultSellerFromSettings,
      seller_name: (settings?.company_name as string) || "",
      seller_cui: (settings?.company_cui as string) || "",
      seller_reg_com: (settings?.company_reg_com as string) || "",
      seller_address: (settings?.company_address as string) || "",
      seller_bank: (settings?.company_bank as string) || "",
      seller_iban: (settings?.company_iban as string) || "",
      buyer_name: addr?.full_name || "",
      buyer_address: addr ? `${addr.address}, ${addr.city}, ${addr.county}` : "",
      buyer_email: order.user_email || "",
      buyer_phone: addr?.phone || "",
      items: items.length > 0 ? items : [{ ...emptyItem }],
    });
    setEditingId(null);
    setFromOrderDialog(false);
    setDialogOpen(true);
  };

  // ─── Helpers ───
  const openNew = () => {
    setEditingId(null);
    setForm({
      ...defaultSellerFromSettings,
      seller_name: (settings?.company_name as string) || "",
      seller_cui: (settings?.company_cui as string) || "",
      seller_reg_com: (settings?.company_reg_com as string) || "",
      seller_address: (settings?.company_address as string) || "",
      seller_bank: (settings?.company_bank as string) || "",
      seller_iban: (settings?.company_iban as string) || "",
    });
    setDialogOpen(true);
  };

  const openEdit = (inv: any) => {
    setEditingId(inv.id);
    setForm({
      series: inv.series || "MG",
      type: inv.type || "invoice",
      seller_name: inv.seller_name || "",
      seller_cui: inv.seller_cui || "",
      seller_reg_com: inv.seller_reg_com || "",
      seller_address: inv.seller_address || "",
      seller_bank: inv.seller_bank || "",
      seller_iban: inv.seller_iban || "",
      buyer_name: inv.buyer_name || "",
      buyer_cui: inv.buyer_cui || "",
      buyer_address: inv.buyer_address || "",
      buyer_email: inv.buyer_email || "",
      buyer_phone: inv.buyer_phone || "",
      vat_rate: inv.vat_rate || 19,
      currency: inv.currency || "RON",
      notes: inv.notes || "",
      items: (inv.invoice_items || []).map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        vat_rate: it.vat_rate || 19,
      })),
    });
    setDialogOpen(true);
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, patch: Partial<InvoiceItemForm>) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, ...patch } : item) }));

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatTotal = form.items.reduce((s, i) => s + i.quantity * i.unit_price * (i.vat_rate / 100), 0);
  const grandTotal = subtotal + vatTotal;

  const filtered = invoices.filter((inv: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(s) ||
      inv.buyer_name?.toLowerCase().includes(s) ||
      inv.buyer_cui?.toLowerCase().includes(s)
    );
  });

  // ─── Stats ───
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i: any) => i.status === "draft").length,
    issued: invoices.filter((i: any) => i.status === "issued" || i.status === "sent").length,
    paid: invoices.filter((i: any) => i.status === "paid").length,
    totalValue: invoices.reduce((s: number, i: any) => s + (i.total || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Facturi & Documente
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.total} facturi · {stats.paid} plătite · Total: {stats.totalValue.toLocaleString("ro-RO")} RON
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setFromOrderDialog(true)}>
            <FileText className="w-3.5 h-3.5" /> Din comandă
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" /> Factură nouă
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Ciorne", value: stats.draft, icon: <Clock className="w-4 h-4 text-muted-foreground" /> },
          { label: "Emise", value: stats.issued, icon: <FileText className="w-4 h-4 text-blue-600" /> },
          { label: "Plătite", value: stats.paid, icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
          { label: "Valoare totală", value: `${stats.totalValue.toLocaleString("ro-RO")} RON`, icon: <Receipt className="w-4 h-4 text-primary" /> },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-2">
              {s.icon}
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută număr, client, CUI..." className="pl-7 h-8 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Toate</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <Receipt className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nicio factură găsită.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Nr. Factură</TableHead>
                  <TableHead className="text-[10px]">Data</TableHead>
                  <TableHead className="text-[10px]">Client</TableHead>
                  <TableHead className="text-[10px]">CUI</TableHead>
                  <TableHead className="text-[10px] text-right">Total</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px]">e-Factura</TableHead>
                  <TableHead className="text-[10px] text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv: any) => {
                  const st = statusConfig[inv.status] || statusConfig.draft;
                  const efs = inv.efactura_status ? efacturaStatusConfig[inv.efactura_status] : null;
                  return (
                    <TableRow key={inv.id} className="text-xs">
                      <TableCell className="font-mono font-medium text-[11px]">{inv.invoice_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.issued_at ? format(new Date(inv.issued_at), "dd MMM yyyy", { locale: ro }) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">{inv.buyer_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-[10px]">{inv.buyer_cui || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{(inv.total || 0).toLocaleString("ro-RO")} {inv.currency}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] gap-0.5 ${st.color}`}>
                          {st.icon} {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {efs ? (
                          <Badge variant="outline" className={`text-[9px] ${efs.color}`}>{efs.label}</Badge>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewInvoice(inv)} title="Vizualizare">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
                            fetch(`https://${projectId}.supabase.co/functions/v1/generate-invoice-pdf`, {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ invoice_id: inv.id }),
                            }).then(r => r.text()).then(html => {
                              const win = window.open("", "_blank");
                              if (win) { win.document.write(html); win.document.close(); }
                            }).catch(() => toast.error("Eroare PDF"));
                          }} title="Descarcă PDF">
                            <Download className="w-3 h-3" />
                          </Button>
                          {inv.status === "draft" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(inv)} title="Editează">
                              <FileText className="w-3 h-3" />
                            </Button>
                          )}
                          <Select
                            value={inv.status}
                            onValueChange={v => statusMutation.mutate({ id: inv.id, status: v })}
                          >
                            <SelectTrigger className="h-6 w-20 text-[9px] border-none bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {inv.status === "draft" && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Ștergi factura?")) deleteMutation.mutate(inv.id); }}
                              title="Șterge"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
      )}

      {/* ─── View Invoice Dialog ─── */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              Factură {viewInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Furnizor</p>
                  <p className="font-semibold">{viewInvoice.seller_name}</p>
                  <p>CUI: {viewInvoice.seller_cui}</p>
                  <p>Reg. Com.: {viewInvoice.seller_reg_com}</p>
                  <p>{viewInvoice.seller_address}</p>
                  {viewInvoice.seller_iban && <p>IBAN: {viewInvoice.seller_iban}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Client</p>
                  <p className="font-semibold">{viewInvoice.buyer_name}</p>
                  {viewInvoice.buyer_cui && <p>CUI: {viewInvoice.buyer_cui}</p>}
                  <p>{viewInvoice.buyer_address}</p>
                  {viewInvoice.buyer_email && <p>{viewInvoice.buyer_email}</p>}
                </div>
              </div>
              <Separator />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Descriere</TableHead>
                    <TableHead className="text-[10px] text-right">Cant.</TableHead>
                    <TableHead className="text-[10px] text-right">Preț unit.</TableHead>
                    <TableHead className="text-[10px] text-right">TVA</TableHead>
                    <TableHead className="text-[10px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(viewInvoice.invoice_items || []).map((item: any) => (
                    <TableRow key={item.id} className="text-xs">
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unit_price?.toLocaleString("ro-RO")}</TableCell>
                      <TableCell className="text-right">{item.vat_rate}%</TableCell>
                      <TableCell className="text-right font-medium">{item.total?.toLocaleString("ro-RO")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <div className="text-right space-y-0.5">
                  <p>Subtotal: <span className="font-medium">{viewInvoice.subtotal?.toLocaleString("ro-RO")} {viewInvoice.currency}</span></p>
                  <p>TVA: <span className="font-medium">{viewInvoice.vat_amount?.toLocaleString("ro-RO")} {viewInvoice.currency}</span></p>
                  <p className="text-sm font-bold">Total: {viewInvoice.total?.toLocaleString("ro-RO")} {viewInvoice.currency}</p>
                </div>
              </div>
              {viewInvoice.notes && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Observații</p>
                  <p>{viewInvoice.notes}</p>
                </div>
              )}
              {viewInvoice.efactura_status && (
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-[10px] font-medium flex items-center gap-1">
                    <FileCode className="w-3 h-3" /> e-Factura
                  </p>
                  <p className="text-[10px]">Status: {efacturaStatusConfig[viewInvoice.efactura_status]?.label || viewInvoice.efactura_status}</p>
                  {viewInvoice.efactura_id && <p className="text-[10px]">ID: {viewInvoice.efactura_id}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── From Order Dialog ─── */}
      <Dialog open={fromOrderDialog} onOpenChange={setFromOrderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Generează factură din comandă</DialogTitle>
            <DialogDescription className="text-xs">Selectează comanda pentru care vrei să emiți factură.</DialogDescription>
          </DialogHeader>
          <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selectează comanda..." /></SelectTrigger>
            <SelectContent>
              {orders.map((o: any) => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  #{o.order_number || o.id.slice(0, 8)} — {o.user_email} — {o.total?.toLocaleString("ro-RO")} RON
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button size="sm" className="text-xs" disabled={!selectedOrderId} onClick={() => generateFromOrder(selectedOrderId)}>
              Generează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              {editingId ? "Editare factură" : "Factură nouă"}
            </DialogTitle>
            <DialogDescription className="text-xs">Completează datele furnizor, client și linii factură.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type + Series */}
            <div className="flex gap-3">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Tip document</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice" className="text-xs">Factură</SelectItem>
                    <SelectItem value="proforma" className="text-xs">Proformă</SelectItem>
                    <SelectItem value="aviz" className="text-xs">Aviz</SelectItem>
                    <SelectItem value="storno" className="text-xs">Storno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Serie</Label>
                <Input value={form.series} onChange={e => setForm({ ...form, series: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="space-y-1 w-20">
                <Label className="text-xs">TVA %</Label>
                <Input type="number" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: Number(e.target.value) })} className="h-8 text-xs" />
              </div>
            </div>

            {/* Seller + Buyer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1"><Building2 className="w-3 h-3" /> Furnizor</p>
                <Input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })} className="h-7 text-[10px]" placeholder="Denumire firmă" />
                <div className="flex gap-1">
                  <Input value={form.seller_cui} onChange={e => setForm({ ...form, seller_cui: e.target.value })} className="h-7 text-[10px]" placeholder="CUI" />
                  <Input value={form.seller_reg_com} onChange={e => setForm({ ...form, seller_reg_com: e.target.value })} className="h-7 text-[10px]" placeholder="Reg. Com." />
                </div>
                <Input value={form.seller_address} onChange={e => setForm({ ...form, seller_address: e.target.value })} className="h-7 text-[10px]" placeholder="Adresă" />
                <div className="flex gap-1">
                  <Input value={form.seller_bank} onChange={e => setForm({ ...form, seller_bank: e.target.value })} className="h-7 text-[10px]" placeholder="Bancă" />
                  <Input value={form.seller_iban} onChange={e => setForm({ ...form, seller_iban: e.target.value })} className="h-7 text-[10px]" placeholder="IBAN" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1"><Building2 className="w-3 h-3" /> Client</p>
                <Input value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} className="h-7 text-[10px]" placeholder="Denumire / Nume" />
                <Input value={form.buyer_cui} onChange={e => setForm({ ...form, buyer_cui: e.target.value })} className="h-7 text-[10px]" placeholder="CUI (opțional pt. PF)" />
                <Input value={form.buyer_address} onChange={e => setForm({ ...form, buyer_address: e.target.value })} className="h-7 text-[10px]" placeholder="Adresă" />
                <div className="flex gap-1">
                  <Input value={form.buyer_email} onChange={e => setForm({ ...form, buyer_email: e.target.value })} className="h-7 text-[10px]" placeholder="Email" />
                  <Input value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} className="h-7 text-[10px]" placeholder="Telefon" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Linii factură</p>
                <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-0.5" /> Linie
                </Button>
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_60px_90px_50px_80px_28px] gap-1 text-[9px] text-muted-foreground px-1">
                  <span>Descriere</span><span className="text-right">Cant.</span><span className="text-right">Preț unit.</span>
                  <span className="text-right">TVA%</span><span className="text-right">Total</span><span></span>
                </div>
                {form.items.map((item, i) => {
                  const lineTotal = item.quantity * item.unit_price * (1 + item.vat_rate / 100);
                  return (
                    <div key={i} className="grid grid-cols-[1fr_60px_90px_50px_80px_28px] gap-1 items-center">
                      <Input value={item.description} onChange={e => updateItem(i, { description: e.target.value })} className="h-7 text-[10px]" placeholder="Descriere produs/serviciu" />
                      <Input type="number" value={item.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} className="h-7 text-[10px] text-right" min={1} />
                      <Input type="number" value={item.unit_price} onChange={e => updateItem(i, { unit_price: Number(e.target.value) })} className="h-7 text-[10px] text-right" min={0} step={0.01} />
                      <Input type="number" value={item.vat_rate} onChange={e => updateItem(i, { vat_rate: Number(e.target.value) })} className="h-7 text-[10px] text-right" />
                      <p className="text-[10px] text-right font-medium pr-1">{lineTotal.toLocaleString("ro-RO")}</p>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(i)} disabled={form.items.length <= 1}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-border">
                <div className="text-right space-y-0.5 text-xs">
                  <p>Subtotal: <span className="font-medium">{subtotal.toLocaleString("ro-RO")} {form.currency}</span></p>
                  <p>TVA: <span className="font-medium">{vatTotal.toLocaleString("ro-RO")} {form.currency}</span></p>
                  <p className="text-sm font-bold">Total: {grandTotal.toLocaleString("ro-RO")} {form.currency}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Observații</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-xs h-14" placeholder="Mențiuni, termeni de plată..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button
              size="sm" className="text-xs"
              onClick={() => {
                if (!form.buyer_name.trim()) { toast.error("Completează numele clientului!"); return; }
                if (form.items.length === 0 || !form.items[0].description) { toast.error("Adaugă cel puțin o linie!"); return; }
                saveMutation.mutate({ ...form, id: editingId || undefined });
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {editingId ? "Salvează" : "Emite factură"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
