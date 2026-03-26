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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Eye, CheckCircle2, XCircle, Clock, Package, Download,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "În așteptare", variant: "secondary" },
  approved: { label: "Aprobată", variant: "default" },
  rejected: { label: "Respinsă", variant: "destructive" },
  processed: { label: "Procesată", variant: "outline" },
  cancelled: { label: "Anulată", variant: "secondary" },
};

const TYPE_MAP: Record<string, string> = {
  return: "Retur",
  same_exchange: "Schimb același",
  different_exchange: "Schimb alt produs",
  cancellation: "Anulare",
};

export default function AdminReturns() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["admin-return-requests", statusFilter],
    queryFn: async () => {
      let q = (supabase as any).from("returns").select("*, orders(id, total, user_email)").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q.limit(200);
      return (data || []) as any[];
    },
  });

  const { data: returnItems = [] } = useQuery({
    queryKey: ["return-items", selectedReturn?.id],
    enabled: !!selectedReturn,
    queryFn: async () => {
      const { data } = await (supabase as any).from("return_request_items").select("*, products(name, image_url)").eq("return_request_id", selectedReturn.id);
      return (data || []) as any[];
    },
  });

  const { data: returnNotes = [] } = useQuery({
    queryKey: ["return-notes", selectedReturn?.id],
    enabled: !!selectedReturn,
    queryFn: async () => {
      const { data } = await (supabase as any).from("return_request_notes").select("*").eq("return_request_id", selectedReturn.id).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, extra }: { id: string; status: string; extra?: Record<string, any> }) => {
      await (supabase as any).from("returns").update({ status, ...extra, updated_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-return-requests"] });
      toast.success("Status actualizat!");
    },
  });

  async function handleApprove() {
    if (!selectedReturn) return;
    updateStatus.mutate({ id: selectedReturn.id, status: "approved", extra: { admin_notes: adminNote || selectedReturn.admin_notes } });
    setDetailOpen(false);
  }

  async function handleReject() {
    if (!selectedReturn) return;
    updateStatus.mutate({ id: selectedReturn.id, status: "rejected", extra: { rejection_reason: rejectionReason, admin_notes: adminNote || selectedReturn.admin_notes } });
    setRejectOpen(false);
    setDetailOpen(false);
    setRejectionReason("");
  }

  async function handleProcess() {
    if (!selectedReturn) return;
    updateStatus.mutate({ id: selectedReturn.id, status: "processed" });
    setDetailOpen(false);
  }

  async function addNote() {
    if (!selectedReturn || !adminNote.trim()) return;
    await (supabase as any).from("return_request_notes").insert({
      return_request_id: selectedReturn.id,
      note_text: adminNote,
      admin_user_id: (await supabase.auth.getUser()).data.user?.id,
    });
    setAdminNote("");
    queryClient.invalidateQueries({ queryKey: ["return-notes", selectedReturn.id] });
    toast.success("Notă adăugată");
  }

  const filtered = returns.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.id?.toLowerCase().includes(s) || r.orders?.user_email?.toLowerCase().includes(s);
  });

  const statusCounts = returns.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function exportCsv() {
    const csv = ["ID,Data,Client,Comanda,Tip,Status"]
      .concat(filtered.map((r: any) => `${r.id},${r.created_at},${r.orders?.user_email || ""},${r.order_id},${r.type || "return"},${r.status}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cereri-retur.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cereri Retur</h1>
          <p className="text-sm text-muted-foreground">Gestionează cererile de retur, schimb și anulare.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">Toate ({returns.length})</TabsTrigger>
          <TabsTrigger value="pending">În așteptare ({statusCounts.pending || 0})</TabsTrigger>
          <TabsTrigger value="approved">Aprobate ({statusCounts.approved || 0})</TabsTrigger>
          <TabsTrigger value="rejected">Respinse ({statusCounts.rejected || 0})</TabsTrigger>
          <TabsTrigger value="processed">Procesate ({statusCounts.processed || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută după ID sau email..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nu există cereri de retur.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">#{r.id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{r.created_at ? format(new Date(r.created_at), "dd.MM.yyyy HH:mm", { locale: ro }) : "-"}</TableCell>
                    <TableCell className="text-sm">{r.orders?.user_email || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">#{r.order_id?.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{TYPE_MAP[r.type] || "Retur"}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[r.status]?.variant || "secondary"}>
                        {STATUS_MAP[r.status]?.label || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedReturn(r); setDetailOpen(true); setAdminNote(""); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedReturn(r); setRejectOpen(true); setRejectionReason(""); }}>
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Cerere Retur #{selectedReturn?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={STATUS_MAP[selectedReturn.status]?.variant || "secondary"}>{STATUS_MAP[selectedReturn.status]?.label}</Badge></div>
                <div><span className="text-muted-foreground">Tip:</span> {TYPE_MAP[selectedReturn.type] || "Retur"}</div>
                <div><span className="text-muted-foreground">Client:</span> {selectedReturn.orders?.user_email}</div>
                <div><span className="text-muted-foreground">Data:</span> {selectedReturn.created_at ? format(new Date(selectedReturn.created_at), "dd.MM.yyyy HH:mm") : "-"}</div>
              </div>

              {selectedReturn.reason && (
                <div><Label className="text-muted-foreground">Motiv:</Label><p className="text-sm">{selectedReturn.reason}</p></div>
              )}
              {selectedReturn.details && (
                <div><Label className="text-muted-foreground">Detalii:</Label><p className="text-sm">{selectedReturn.details}</p></div>
              )}
              {selectedReturn.refund_method && selectedReturn.refund_method !== "none" && (
                <div><Label className="text-muted-foreground">Metoda rambursare:</Label><p className="text-sm">{selectedReturn.refund_method}</p></div>
              )}
              {selectedReturn.bank_iban && (
                <div className="text-sm"><span className="text-muted-foreground">IBAN:</span> {selectedReturn.bank_iban}</div>
              )}

              {/* Items */}
              {returnItems.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Produse returnate:</Label>
                  <div className="space-y-2 mt-1">
                    {returnItems.map((item: any) => (
                      <div key={item.id} className="flex gap-3 items-center border rounded p-2">
                        {item.products?.image_url && <img src={item.products.image_url} className="w-10 h-10 object-cover rounded" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.products?.name || item.product_name || "Produs"}</p>
                          <p className="text-xs text-muted-foreground">Cantitate: {item.quantity || item.quantity_returned || 1}</p>
                          {item.return_reason_text && <p className="text-xs text-muted-foreground">Motiv: {item.return_reason_text}</p>}
                        </div>
                        {item.unit_price > 0 && <span className="text-sm font-medium">{Number(item.total_value || item.unit_price).toFixed(2)} RON</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                  <Label className="text-destructive">Motiv respingere:</Label>
                  <p className="text-sm">{selectedReturn.rejection_reason}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label className="text-muted-foreground">Note interne:</Label>
                {returnNotes.length > 0 && (
                  <div className="space-y-1 mt-1 mb-2">
                    {returnNotes.map((n: any) => (
                      <div key={n.id} className="text-xs border rounded p-2 bg-muted/30">
                        <span className="text-muted-foreground">{n.created_at ? format(new Date(n.created_at), "dd.MM.yyyy HH:mm") : ""}</span>
                        <p>{n.note_text}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Adaugă notă internă..." rows={2} className="flex-1" />
                  <Button size="sm" onClick={addNote} disabled={!adminNote.trim()}>Adaugă</Button>
                </div>
              </div>

              {/* Actions */}
              <DialogFooter className="gap-2">
                {selectedReturn.status === "pending" && (
                  <>
                    <Button variant="default" onClick={handleApprove}><CheckCircle2 className="w-4 h-4 mr-1" />Aprobă</Button>
                    <Button variant="destructive" onClick={() => setRejectOpen(true)}><XCircle className="w-4 h-4 mr-1" />Respinge</Button>
                  </>
                )}
                {selectedReturn.status === "approved" && (
                  <Button onClick={handleProcess}><Package className="w-4 h-4 mr-1" />Marchează ca procesată</Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Respinge cererea de retur</DialogTitle></DialogHeader>
          <div>
            <Label>Motivul respingerii *</Label>
            <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="Explică motivul respingerii..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Anulează</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Respinge cererea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
