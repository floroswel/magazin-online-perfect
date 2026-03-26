import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, Clock, CreditCard } from "lucide-react";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  credit_loyalty: "Puncte fidelitate",
  credit_cashback: "Bonus Cashback",
  credit_return: "Retur",
  credit_manual: "Creditare",
  credit_affiliate: "Comision afiliat",
  debit_order: "Plată comandă",
  debit_manual: "Debitare",
  debit_cancelled: "Anulat",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  available: "bg-green-500/15 text-green-600 border-green-500/30",
  used: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  available: "Disponibil",
  used: "Utilizat",
  cancelled: "Anulat",
};

export default function WalletTab() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: wallet } = useQuery({
    queryKey: ["my-wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("customer_wallets" as any)
        .select("*")
        .eq("customer_id", user.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["my-wallet-transactions", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("wallet_transactions" as any)
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data } = await q;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const available = wallet?.available_balance || 0;
  const pending = wallet?.pending_balance || 0;
  const totalUsed = wallet?.total_used || 0;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{format(available)}</p>
                <p className="text-xs text-muted-foreground">Sold disponibil</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{format(pending)}</p>
                <p className="text-xs text-muted-foreground">În așteptare</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{format(totalUsed)}</p>
                <p className="text-xs text-muted-foreground">Total utilizat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Istoric tranzacții</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descriere</TableHead>
                <TableHead>Sumă</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nicio tranzacție în portofel.
                  </TableCell>
                </TableRow>
              ) : transactions.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString("ro-RO")}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{t.description || TYPE_LABELS[t.type] || t.type}</p>
                    {t.order_id && (
                      <p className="text-xs text-muted-foreground">Comandă: #{t.order_id.slice(0, 8)}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-bold ${t.direction === "credit" ? "text-green-600" : "text-red-500"}`}>
                      {t.direction === "credit" ? "+" : "-"}{format(Number(t.amount))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_COLORS[t.status] || ""}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
