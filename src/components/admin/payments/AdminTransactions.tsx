import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, CreditCard, ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "În așteptare", variant: "outline" },
  completed: { label: "Finalizată", variant: "default" },
  failed: { label: "Eșuată", variant: "destructive" },
  refunded: { label: "Rambursată", variant: "secondary" },
  partially_refunded: { label: "Rambursare parțială", variant: "secondary" },
};

export default function AdminTransactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["payment-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*, payment_methods(name, type), orders(order_number, user_email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = transactions.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.external_id?.toLowerCase().includes(s) ||
        t.orders?.order_number?.toLowerCase().includes(s) ||
        t.orders?.user_email?.toLowerCase().includes(s) ||
        t.card_last_four?.includes(s)
      );
    }
    return true;
  });

  // Summary stats
  const totalCompleted = transactions
    .filter((t: any) => t.status === "completed")
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const totalRefunded = transactions
    .filter((t: any) => t.status === "refunded" || t.status === "partially_refunded")
    .reduce((s: number, t: any) => s + Number(t.refunded_amount || 0), 0);
  const pendingCount = transactions.filter((t: any) => t.status === "pending").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tranzacții</h1>
        <p className="text-sm text-muted-foreground">Istoric complet al tranzacțiilor de plată.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Încasări totale</p>
              <p className="text-lg font-bold text-foreground">{totalCompleted.toLocaleString("ro-RO")} RON</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rambursări</p>
              <p className="text-lg font-bold text-foreground">{totalRefunded.toLocaleString("ro-RO")} RON</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">În așteptare</p>
              <p className="text-lg font-bold text-foreground">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută după nr. comandă, email, ID tranzacție..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="completed">Finalizate</SelectItem>
            <SelectItem value="failed">Eșuate</SelectItem>
            <SelectItem value="refunded">Rambursate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nu sunt tranzacții{statusFilter !== "all" ? " cu acest status" : ""}.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Metodă</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead className="text-right">Sumă</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID extern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => {
                  const sc = statusConfig[t.status] || statusConfig.pending;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy, HH:mm", { locale: ro }) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{t.orders?.order_number || "-"}</div>
                        <div className="text-xs text-muted-foreground">{t.orders?.user_email || ""}</div>
                      </TableCell>
                      <TableCell className="text-sm">{t.payment_methods?.name || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {t.card_brand && t.card_last_four ? (
                          <span className="font-mono">{t.card_brand} ****{t.card_last_four}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {Number(t.amount).toLocaleString("ro-RO")} {t.currency}
                        {Number(t.refunded_amount) > 0 && (
                          <div className="text-xs text-orange-600">-{Number(t.refunded_amount).toLocaleString("ro-RO")} refund</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                        {t.external_id || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
