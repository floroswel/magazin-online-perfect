import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Search, Eye, RotateCcw, CheckCircle2, XCircle, Clock, Package,
  Truck, ArrowRight, Ban, ArrowLeftRight, Image as ImageIcon, PackageCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReturnStatus = "pending" | "approved" | "rejected" | "shipped" | "received" | "refunded" | "exchanged" | "closed";

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Solicitată", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Clock },
  approved: { label: "Aprobată", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
  rejected: { label: "Respinsă", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
  shipped: { label: "Expediat", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: Truck },
  received: { label: "Recepționat", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Package },
  refunded: { label: "Rambursat", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: RotateCcw },
  exchanged: { label: "Schimbat", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", icon: ArrowLeftRight },
  closed: { label: "Finalizată", color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: Ban },
};

const STATUS_FLOW: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["shipped", "closed"],
  rejected: ["closed"],
  shipped: ["received"],
  received: ["refunded", "exchanged", "closed"],
  refunded: ["closed"],
  exchanged: ["closed"],
  closed: [],
};

interface ReturnItem {
  id: string;
  order_id: string;
  user_id: string;
  status: ReturnStatus;
  type: string;
  reason: string;
  details: string | null;
  resolution: string | null;
  admin_notes: string | null;
  refund_amount: number;
  tracking_number: string | null;
  photos: string[];
  items: any[];
  created_at: string;
  updated_at: string;
  order_total?: number;
  user_name?: string;
  user_email?: string | null;
  return_items?: any[];
}

export default function AdminReturns() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [detail, setDetail] = useState<ReturnItem | null>(null);
  const [editStatus, setEditStatus] = useState<ReturnStatus | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [editRefund, setEditRefund] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [restockItems, setRestockItems] = useState<Record<string, boolean>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orderIds = [...new Set((data || []).map((r: any) => r.order_id))];
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const returnIds = (data || []).map((r: any) => r.id);

      const [{ data: orders }, { data: profiles }, { data: returnItems }] = await Promise.all([
        supabase.from("orders").select("id, total").in("id", orderIds.length ? orderIds : ["_"]),
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds.length ? userIds : ["_"]),
        supabase.from("return_request_items").select("*").in("return_request_id", returnIds.length ? returnIds : ["_"]),
      ]);

      const orderMap = new Map(orders?.map((o) => [o.id, o]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const itemsMap = new Map<string, any[]>();
      (returnItems || []).forEach((ri: any) => {
        const list = itemsMap.get(ri.return_request_id) || [];
        list.push(ri);
        itemsMap.set(ri.return_request_id, list);
      });

      return (data || []).map((r: any) => ({
        ...r,
        photos: r.photos || [],
        type: r.type || "return",
        order_total: orderMap.get(r.order_id)?.total || 0,
        user_name: profileMap.get(r.user_id)?.full_name || null,
        return_items: itemsMap.get(r.id) || [],
      })) as ReturnItem[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("returns").update(updates).eq("id", id);
      if (error) throw error;

      // If received and restock selected, update product stock
      if (updates.status === "received") {
        for (const [itemId, shouldRestock] of Object.entries(restockItems)) {
          if (shouldRestock) {
            const item = detail?.return_items?.find((ri: any) => ri.id === itemId);
            if (item?.product_id) {
              await supabase.rpc("search_products", { search_term: "" }).then(() => {}); // noop
              // Update stock directly
              const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
              if (prod) {
                await supabase.from("products").update({ stock: (prod.stock || 0) + item.quantity }).eq("id", item.product_id);
              }
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Retur actualizat!");
      setDetail(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openDetail = (r: ReturnItem) => {
    setDetail(r);
    setEditStatus(r.status);
    setEditNotes(r.admin_notes || "");
    setEditRefund(String(r.refund_amount || ""));
    setEditTracking(r.tracking_number || "");
    setEditResolution(r.resolution || "");
    const restock: Record<string, boolean> = {};
    (r.return_items || []).forEach((ri: any) => { restock[ri.id] = true; });
    setRestockItems(restock);
  };

  const handleSave = () => {
    if (!detail) return;
    const newStatus = editStatus || detail.status;
    updateMutation.mutate({
      id: detail.id,
      updates: {
        status: newStatus,
        admin_notes: editNotes || null,
        refund_amount: parseFloat(editRefund) || 0,
        tracking_number: editTracking || null,
        resolution: editResolution || null,
      },
    });
  };

  // KPI
  const pending = returns.filter((r) => r.status === "pending").length;
  const approved = returns.filter((r) => ["approved", "shipped"].includes(r.status)).length;
  const totalRefunded = returns.filter((r) => r.status === "refunded").reduce((s, r) => s + (r.refund_amount || 0), 0);
  const exchanges = returns.filter((r) => r.type === "exchange").length;

  const filtered = returns.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.order_id.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.user_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Retururi & Schimburi (RMA)</h1>
        <p className="text-sm text-muted-foreground">Gestionare cereri de retur, schimburi, aprobare, tracking și rambursări</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total cereri</p>
          <p className="text-2xl font-bold text-foreground">{returns.length}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Solicitate</p>
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">În procesare</p>
          <p className="text-2xl font-bold text-blue-400">{approved}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Schimburi</p>
          <p className="text-2xl font-bold text-purple-400">{exchanges}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Rambursări</p>
          <p className="text-2xl font-bold text-green-400">{totalRefunded.toFixed(2)} RON</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <CardTitle className="text-foreground">Cereri ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-44" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  <SelectItem value="return">Retur</SelectItem>
                  <SelectItem value="exchange">Schimb</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nicio cerere de retur.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Motiv</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Sumă</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{r.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{r.user_name || "Client"}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{r.order_id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.type === "exchange" ? "border-purple-500/30 text-purple-400" : ""}>
                          {r.type === "exchange" ? <><ArrowLeftRight className="w-3 h-3 mr-1" />Schimb</> : <><RotateCcw className="w-3 h-3 mr-1" />Retur</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{r.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border gap-1", cfg.color)}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.photos?.length > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ImageIcon className="w-3 h-3" />{r.photos.length}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {r.refund_amount ? `${r.refund_amount} RON` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: ro })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (() => {
            const cfg = STATUS_CONFIG[detail.status];
            const Icon = cfg.icon;
            const nextStatuses = STATUS_FLOW[detail.status] || [];

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {detail.type === "exchange" ? <ArrowLeftRight className="w-5 h-5 text-purple-400" /> : <RotateCcw className="w-5 h-5 text-primary" />}
                    {detail.type === "exchange" ? "Schimb" : "Retur"} #{detail.id.slice(0, 8)}
                  </DialogTitle>
                  <DialogDescription>
                    Cerere creată pe {format(new Date(detail.created_at), "dd MMMM yyyy, HH:mm", { locale: ro })}
                  </DialogDescription>
                </DialogHeader>

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Client</p>
                    <p className="text-sm font-medium text-foreground">{detail.user_name || "Client"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Comandă</p>
                    <p className="font-mono text-sm text-foreground">#{detail.order_id.slice(0, 12)}</p>
                    <p className="text-xs text-muted-foreground">{detail.order_total} RON</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Status curent</p>
                    <Badge variant="outline" className={cn("border gap-1", cfg.color)}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Motiv</p>
                    <p className="text-sm text-foreground">{detail.reason}</p>
                  </div>
                </div>

                {detail.details && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Explicație client</p>
                    <p className="text-sm text-foreground">{detail.details}</p>
                  </div>
                )}

                {/* Return items */}
                {detail.return_items && detail.return_items.length > 0 && (
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">Produse solicitate:</p>
                    {detail.return_items.map((ri: any) => (
                      <div key={ri.id} className="flex items-center justify-between text-sm bg-muted/20 rounded p-2">
                        <div>
                          <p className="font-medium">{ri.product_name}</p>
                          <p className="text-xs text-muted-foreground">Cantitate: {ri.quantity}</p>
                        </div>
                        {ri.exchange_product_id && (
                          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                            <ArrowLeftRight className="w-3 h-3 mr-1" /> Schimb solicitat
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Photos */}
                {detail.photos && detail.photos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" /> Fotografii atașate ({detail.photos.length})
                    </p>
                    <div className="flex gap-2">
                      {detail.photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-20 h-20 rounded border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPhotoPreview(url)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status update */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <p className="font-medium text-foreground text-sm flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" /> Actualizare status
                  </p>
                  {nextStatuses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map((ns) => {
                        const nsCfg = STATUS_CONFIG[ns];
                        const NsIcon = nsCfg.icon;
                        return (
                          <Button key={ns} variant={editStatus === ns ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setEditStatus(ns)}>
                            <NsIcon className="w-3.5 h-3.5" />{nsCfg.label}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Această cerere este finalizată.</p>
                  )}
                </div>

                {/* Restock option (when marking as received) */}
                {editStatus === "received" && detail.return_items && detail.return_items.length > 0 && (
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <p className="font-medium text-foreground text-sm flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-emerald-400" /> Restock produse
                    </p>
                    {detail.return_items.map((ri: any) => (
                      <div key={ri.id} className="flex items-center justify-between">
                        <span className="text-sm">{ri.product_name} × {ri.quantity}</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Adaugă în stoc</Label>
                          <Switch
                            checked={restockItems[ri.id] !== false}
                            onCheckedChange={(v) => setRestockItems(prev => ({ ...prev, [ri.id]: v }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editable fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Sumă ramburs (RON)</Label>
                      <Input type="number" value={editRefund} onChange={(e) => setEditRefund(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>AWB Retur</Label>
                      <Input value={editTracking} onChange={(e) => setEditTracking(e.target.value)} placeholder="Număr tracking retur" />
                    </div>
                  </div>

                  <div>
                    <Label>Rezoluție</Label>
                    <Select value={editResolution} onValueChange={setEditResolution}>
                      <SelectTrigger><SelectValue placeholder="Selectează rezoluția" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="refund">Rambursare integrală</SelectItem>
                        <SelectItem value="partial_refund">Rambursare parțială</SelectItem>
                        <SelectItem value="replacement">Înlocuire produs</SelectItem>
                        <SelectItem value="repair">Reparație</SelectItem>
                        <SelectItem value="credit">Credit magazin</SelectItem>
                        <SelectItem value="rejected">Respins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Note admin</Label>
                    <Textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Note interne..." />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetail(null)}>Închide</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Se salvează..." : "Salvează modificări"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Photo preview */}
      <Dialog open={!!photoPreview} onOpenChange={(open) => !open && setPhotoPreview(null)}>
        <DialogContent className="max-w-lg p-2">
          {photoPreview && <img src={photoPreview} alt="Preview" className="w-full rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
