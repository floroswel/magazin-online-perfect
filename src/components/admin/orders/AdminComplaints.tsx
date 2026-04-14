import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Download, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_analiza: { label: "În analiză", color: "bg-yellow-100 text-yellow-800" },
  rezolvat: { label: "Rezolvat", color: "bg-green-100 text-green-800" },
  escalat: { label: "Escalat", color: "bg-red-100 text-red-800" },
};

const CHANNELS = ["site", "email", "telefon", "social_media", "chat"];

interface ComplaintForm {
  complaint_date: string;
  channel: string;
  customer_name: string;
  customer_email: string;
  order_number: string;
  description: string;
  status: string;
  resolution: string;
  admin_notes: string;
}

const EMPTY: ComplaintForm = {
  complaint_date: new Date().toISOString().split("T")[0],
  channel: "site",
  customer_name: "",
  customer_email: "",
  order_number: "",
  description: "",
  status: "in_analiza",
  resolution: "",
  admin_notes: "",
};

export default function AdminComplaints() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ComplaintForm>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editId) {
        await supabase.from("complaints").update(form as any).eq("id", editId);
      } else {
        await supabase.from("complaints").insert(form as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      toast.success(editId ? "Reclamație actualizată" : "Reclamație adăugată");
      setOpen(false);
      setForm(EMPTY);
      setEditId(null);
    },
    onError: () => toast.error("Eroare la salvare"),
  });

  const openEdit = (c: any) => {
    setForm({
      complaint_date: c.complaint_date || "",
      channel: c.channel || "site",
      customer_name: c.customer_name || "",
      customer_email: c.customer_email || "",
      order_number: c.order_number || "",
      description: c.description || "",
      status: c.status || "in_analiza",
      resolution: c.resolution || "",
      admin_notes: c.admin_notes || "",
    });
    setEditId(c.id);
    setOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Data", "Canal", "Client", "Email", "Nr. Comandă", "Descriere", "Status", "Rezoluție"];
    const rows = complaints.map((c: any) => [
      c.complaint_date, c.channel, c.customer_name, c.customer_email || "",
      c.order_number || "", c.description, STATUS_MAP[c.status]?.label || c.status, c.resolution || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reclamatii_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = complaints.filter((c: any) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (c.customer_name || "").toLowerCase().includes(s) ||
        (c.order_number || "").toLowerCase().includes(s) ||
        (c.description || "").toLowerCase().includes(s);
    }
    return true;
  });

  const counts = {
    total: complaints.length,
    in_analiza: complaints.filter((c: any) => c.status === "in_analiza").length,
    rezolvat: complaints.filter((c: any) => c.status === "rezolvat").length,
    escalat: complaints.filter((c: any) => c.status === "escalat").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Registru Reclamații</h1>
          <p className="text-sm text-muted-foreground">Conform OG 21/1992 — obligatoriu pentru comercianți</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(EMPTY); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă reclamație</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Editare reclamație" : "Reclamație nouă"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data</Label><Input type="date" value={form.complaint_date} onChange={e => setForm(f => ({ ...f, complaint_date: e.target.value }))} /></div>
                  <div><Label>Canal</Label>
                    <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nume client</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                  <div><Label>Email client</Label><Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
                </div>
                <div><Label>Nr. comandă (opțional)</Label><Input value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))} /></div>
                <div><Label>Descriere reclamație</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_analiza">În analiză</SelectItem>
                      <SelectItem value="rezolvat">Rezolvat</SelectItem>
                      <SelectItem value="escalat">Escalat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Soluția aplicată</Label><Textarea value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} rows={2} /></div>
                <div><Label>Note admin</Label><Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={2} /></div>
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full">
                  {editId ? "Salvează modificări" : "Adaugă reclamație"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{counts.in_analiza}</p><p className="text-xs text-muted-foreground">În analiză</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{counts.rezolvat}</p><p className="text-xs text-muted-foreground">Rezolvate</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{counts.escalat}</p><p className="text-xs text-muted-foreground">Escalate</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="in_analiza">În analiză</SelectItem>
            <SelectItem value="rezolvat">Rezolvat</SelectItem>
            <SelectItem value="escalat">Escalat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nicio reclamație înregistrată.</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Canal</th>
                <th className="p-2 text-left">Client</th>
                <th className="p-2 text-left">Nr. Comandă</th>
                <th className="p-2 text-left">Descriere</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="p-2 whitespace-nowrap">{c.complaint_date}</td>
                  <td className="p-2">{c.channel}</td>
                  <td className="p-2">{c.customer_name}</td>
                  <td className="p-2">{c.order_number || "—"}</td>
                  <td className="p-2 max-w-[200px] truncate">{c.description}</td>
                  <td className="p-2">
                    <Badge className={STATUS_MAP[c.status]?.color || ""}>{STATUS_MAP[c.status]?.label || c.status}</Badge>
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editează</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
