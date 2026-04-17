import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Search, Download, Eye, RotateCcw, Hash, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { translateOrderStatus } from "@/lib/orderStatusLabels";

const ISSUE_LABELS: Record<string, { label: string; className: string }> = {
  payment_failed: { label: "Plată eșuată", className: "bg-red-100 text-red-800" },
  stock_issue: { label: "Stoc insuficient", className: "bg-orange-100 text-orange-800" },
  cancelled: { label: "Anulată", className: "bg-gray-100 text-gray-800" },
};

export default function AdminIssueOrders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["issue-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(quantity)")
        .in("status", ["payment_failed", "stock_issue", "cancelled"])
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = orders.filter(
    (o: any) =>
      !search ||
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_address as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      (o.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.order_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = filtered.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  const restoreOrder = async (orderId: string, currentStatus: string) => {
    await supabase.from("orders").update({ status: "pending" }).eq("id", orderId);
    await supabase.from("order_timeline").insert({
      order_id: orderId, action: "status_change", old_status: currentStatus, new_status: "pending", note: "Restaurat de admin din Probleme",
    });
    queryClient.invalidateQueries({ queryKey: ["issue-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Comandă restaurată!");
  };

  const exportCSV = () => {
    const rows = [["ID", "Nr.", "Client", "Email", "Problemă", "Total", "Data"]];
    filtered.forEach((o: any) => {
      rows.push([o.id.slice(0, 8), o.order_number || "", (o.shipping_address as any)?.full_name || "", o.user_email || "", o.status, String(o.total), format(new Date(o.created_at), "yyyy-MM-dd HH:mm")]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "comenzi-probleme.csv"; a.click();
    toast.success(`${filtered.length} comenzi exportate`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" /> Comenzi cu Probleme
          </h1>
          <p className="text-sm text-muted-foreground">Plată eșuată, stoc insuficient sau alte probleme.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><Hash className="w-5 h-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Total probleme</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><DollarSign className="w-5 h-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold">{totalValue.toLocaleString("ro-RO")} RON</p>
              <p className="text-xs text-muted-foreground">Valoare afectată</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === "payment_failed").length}</p>
              <p className="text-xs text-muted-foreground">Plăți eșuate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} comenzi cu probleme</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută ID, nume, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comandă</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Problemă</TableHead>
                <TableHead>Produse</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">🎉 Nicio comandă cu probleme!</TableCell></TableRow>
              ) : filtered.map((o: any) => {
                const issue = ISSUE_LABELS[o.status] || { label: o.status, className: "" };
                return (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <TableCell>
                      <p className="font-mono text-xs">#{o.order_number || o.id.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{(o.shipping_address as any)?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.user_email || ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={issue.className}>{issue.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{o.order_items?.length || 0}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(o.total).toLocaleString("ro-RO")} RON</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(o.created_at), "dd MMM yyyy", { locale: ro })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => restoreOrder(o.id, o.status)}>
                          <RotateCcw className="w-3 h-3" />Restaurează
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
