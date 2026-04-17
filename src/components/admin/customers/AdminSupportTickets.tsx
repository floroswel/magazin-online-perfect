import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ticket, Plus, Pencil, Trash2, Search, Download,
  AlertCircle, Clock, CheckCircle2, XCircle, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  customer_email: string;
  customer_name: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Deschis", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: <AlertCircle className="w-3 h-3" /> },
  in_progress: { label: "În lucru", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  resolved: { label: "Rezolvat", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: "Închis", color: "bg-muted text-muted-foreground border-border", icon: <XCircle className="w-3 h-3" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Scăzut", color: "bg-muted text-muted-foreground border-border" },
  normal: { label: "Normal", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  high: { label: "Ridicat", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

const emptyTicket: Partial<SupportTicket> = {
  subject: "",
  body: "",
  status: "open",
  priority: "normal",
  customer_email: "",
  customer_name: "",
  assigned_to: null,
};

export default function AdminSupportTickets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [editTicket, setEditTicket] = useState<Partial<SupportTicket> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
  });

  const filtered = tickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.customer_email.toLowerCase().includes(q) ||
        (t.customer_name || "").toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countByStatus = (s: string) => tickets.filter((t) => t.status === s).length;

  const saveMut = useMutation({
    mutationFn: async (ticket: Partial<SupportTicket>) => {
      const payload = {
        subject: ticket.subject!.trim(),
        body: ticket.body!.trim(),
        status: ticket.status || "open",
        priority: ticket.priority || "normal",
        customer_email: ticket.customer_email!.trim(),
        customer_name: ticket.customer_name?.trim() || null,
        assigned_to: ticket.assigned_to || null,
      };
      if (ticket.id) {
        const { error } = await supabase.from("support_tickets").update(payload).eq("id", ticket.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("support_tickets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success(isNew ? "Tichet creat" : "Tichet actualizat");
      setEditTicket(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Tichet șters");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Status actualizat");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportCSV = () => {
    if (!filtered.length) { toast.error("Nicio înregistrare"); return; }
    const rows = [
      ["ID", "Subiect", "Client", "Email", "Status", "Prioritate", "Creat la", "Actualizat"],
      ...filtered.map((t) => [
        t.id.slice(0, 8),
        t.subject,
        t.customer_name || "",
        t.customer_email,
        statusConfig[t.status]?.label || t.status,
        priorityConfig[t.priority]?.label || t.priority,
        format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
        format(new Date(t.updated_at), "yyyy-MM-dd HH:mm"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tichete-suport-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} tichete exportate`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tichete Suport</h1>
        <p className="text-sm text-muted-foreground">Gestionare cereri clienți și helpdesk</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
              </div>
              <Ticket className="w-8 h-8 text-muted-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>
        {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <Card key={s} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{cfg.label}</p>
                    <p className="text-2xl font-bold text-foreground">{countByStatus(s)}</p>
                  </div>
                  <div className="opacity-60">{cfg.icon}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <CardTitle className="text-foreground">Tichete ({filtered.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Caută subiect/email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate status</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate prior.</SelectItem>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button size="sm" className="gap-2" onClick={() => { setEditTicket({ ...emptyTicket }); setIsNew(true); }}>
                <Plus className="w-4 h-4" /> Tichet nou
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subiect</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioritate</TableHead>
                  <TableHead>Creat</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const sc = statusConfig[t.status] || statusConfig.open;
                  const pc = priorityConfig[t.priority] || priorityConfig.normal;
                  return (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => setViewTicket(t)}>
                      <TableCell>
                        <p className="font-medium text-foreground truncate max-w-[250px]">{t.subject}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">{t.body.slice(0, 80)}{t.body.length > 80 ? "…" : ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{t.customer_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{t.customer_email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", sc.color)}>{sc.icon} {sc.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(t.created_at), "dd MMM yyyy", { locale: ro })}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Select value={t.status} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTicket({ ...t }); setIsNew(false); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Ștergi tichetul?")) deleteMut.mutate(t.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      Niciun tichet găsit.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewTicket} onOpenChange={(o) => !o && setViewTicket(null)}>
        <DialogContent className="max-w-lg">
          {viewTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{viewTicket.subject}</DialogTitle>
                <DialogDescription>
                  <span className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("gap-1", statusConfig[viewTicket.status]?.color)}>
                      {statusConfig[viewTicket.status]?.icon} {statusConfig[viewTicket.status]?.label}
                    </Badge>
                    <Badge variant="outline" className={priorityConfig[viewTicket.priority]?.color}>
                      {priorityConfig[viewTicket.priority]?.label}
                    </Badge>
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium text-foreground">{viewTicket.customer_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{viewTicket.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creat</p>
                    <p className="text-foreground">{format(new Date(viewTicket.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actualizat</p>
                    <p className="text-foreground">{format(new Date(viewTicket.updated_at), "dd MMM yyyy, HH:mm", { locale: ro })}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mesaj</p>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground whitespace-pre-wrap">
                    {viewTicket.body}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewTicket(null)}>Închide</Button>
                  <Button onClick={() => { setEditTicket({ ...viewTicket }); setIsNew(false); setViewTicket(null); }}>
                    <Pencil className="w-4 h-4 mr-1" /> Editează
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editTicket} onOpenChange={(o) => !o && setEditTicket(null)}>
        <DialogContent className="max-w-lg">
          {editTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "Tichet nou" : `Editare: ${editTicket.subject}`}</DialogTitle>
                <DialogDescription>Completează detaliile tichetului de suport</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subiect</Label>
                  <Input value={editTicket.subject || ""} onChange={(e) => setEditTicket({ ...editTicket, subject: e.target.value })} placeholder="Subiect tichet" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nume client</Label>
                    <Input value={editTicket.customer_name || ""} onChange={(e) => setEditTicket({ ...editTicket, customer_name: e.target.value })} placeholder="Ion Popescu" />
                  </div>
                  <div>
                    <Label>Email client</Label>
                    <Input type="email" value={editTicket.customer_email || ""} onChange={(e) => setEditTicket({ ...editTicket, customer_email: e.target.value })} placeholder="email@exemplu.ro" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={editTicket.status || "open"} onValueChange={(v) => setEditTicket({ ...editTicket, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioritate</Label>
                    <Select value={editTicket.priority || "normal"} onValueChange={(v) => setEditTicket({ ...editTicket, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Mesaj</Label>
                  <Textarea rows={5} value={editTicket.body || ""} onChange={(e) => setEditTicket({ ...editTicket, body: e.target.value })} placeholder="Descriere detaliată a problemei..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditTicket(null)}>Anulează</Button>
                  <Button
                    onClick={() => saveMut.mutate(editTicket)}
                    disabled={!editTicket.subject?.trim() || !editTicket.body?.trim() || !editTicket.customer_email?.trim()}
                  >
                    {isNew ? "Creează" : "Salvează"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
