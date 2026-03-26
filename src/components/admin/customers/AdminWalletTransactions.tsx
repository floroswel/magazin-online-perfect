import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Search, Plus, Minus, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const TYPE_LABELS: Record<string, string> = {
  credit_loyalty: "Puncte fidelitate",
  credit_cashback: "Bonus Cashback",
  credit_return: "Retur",
  credit_manual: "Creditare manuală",
  credit_affiliate: "Comision afiliat",
  debit_order: "Utilizat în comandă",
  debit_manual: "Debitare manuală",
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

export default function AdminWalletTransactions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Manual credit/debit dialog
  const [manualDialog, setManualDialog] = useState<{ open: boolean; mode: "credit" | "debit"; customerId?: string; walletId?: string }>({
    open: false, mode: "credit",
  });
  const [manualForm, setManualForm] = useState({ amount: "", reason: "", status: "available", customerEmail: "" });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-wallet-transactions", search, typeFilter, statusFilter],
    queryFn: async () => {
      let q = (supabase
        .from("wallet_transactions" as any)
        .select("*") as any)
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // Fetch profiles for customer names
  const customerIds = [...new Set(transactions.map((t: any) => t.customer_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["wallet-customer-profiles", customerIds.join(",")],
    queryFn: async () => {
      if (customerIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", customerIds);
      return (data as any[]) || [];
    },
    enabled: customerIds.length > 0,
  });

  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

  const { data: walletStats } = useQuery({
    queryKey: ["admin-wallet-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_wallets" as any).select("available_balance, pending_balance");
      const wallets = (data as any[]) || [];
      return {
        totalAvailable: wallets.reduce((s: number, w: any) => s + (w.available_balance || 0), 0),
        totalPending: wallets.reduce((s: number, w: any) => s + (w.pending_balance || 0), 0),
        count: wallets.length,
      };
    },
  });

  const manualMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(manualForm.amount);
      if (!amount || amount <= 0) throw new Error("Sumă invalidă");

      // Find or create wallet for customer
      let customerId = manualDialog.customerId;
      let walletId = manualDialog.walletId;

      if (!customerId && manualForm.customerEmail) {
        const { data: profile } = await (supabase
          .from("profiles")
          .select("user_id")
          .eq("email", manualForm.customerEmail) as any)
          .maybeSingle();
        if (!profile) throw new Error("Client negăsit cu acest email");
        customerId = profile.user_id;
      }

      if (!customerId) throw new Error("Selectează un client");

      // Get or create wallet
      let { data: wallet } = await supabase
        .from("customer_wallets" as any)
        .select("id, available_balance, pending_balance, total_earned, total_used")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet, error } = await supabase
          .from("customer_wallets" as any)
          .insert({ customer_id: customerId } as any)
          .select("id, available_balance, pending_balance, total_earned, total_used")
          .single();
        if (error) throw error;
        wallet = newWallet as any;
      }

      walletId = (wallet as any).id;
      const w = wallet as any;

      if (manualDialog.mode === "debit" && amount > w.available_balance) {
        throw new Error("Sold insuficient pentru debitare");
      }

      // Insert transaction
      const { error: txError } = await supabase.from("wallet_transactions" as any).insert({
        wallet_id: walletId,
        customer_id: customerId,
        type: manualDialog.mode === "credit" ? "credit_manual" : "debit_manual",
        amount,
        direction: manualDialog.mode,
        status: manualDialog.mode === "credit" ? manualForm.status : "used",
        description: manualForm.reason || (manualDialog.mode === "credit" ? "Creditare manuală" : "Debitare manuală"),
        created_by_admin_id: user?.id,
      } as any);
      if (txError) throw txError;

      // Update wallet balance
      const updates: any = { updated_at: new Date().toISOString() };
      if (manualDialog.mode === "credit") {
        if (manualForm.status === "available") {
          updates.available_balance = w.available_balance + amount;
        } else {
          updates.pending_balance = w.pending_balance + amount;
        }
        updates.total_earned = w.total_earned + amount;
      } else {
        updates.available_balance = w.available_balance - amount;
        updates.total_used = w.total_used + amount;
      }

      const { error: updateError } = await supabase
        .from("customer_wallets" as any)
        .update(updates)
        .eq("id", walletId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      setManualDialog({ open: false, mode: "credit" });
      setManualForm({ amount: "", reason: "", status: "available", customerEmail: "" });
      toast.success(manualDialog.mode === "credit" ? "Credite adăugate!" : "Credite debitate!");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Tranzacții Wallet
          </h1>
          <p className="text-sm text-muted-foreground">Toate tranzacțiile din portofelele virtuale ale clienților</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setManualDialog({ open: true, mode: "debit" }); setManualForm({ amount: "", reason: "", status: "available", customerEmail: "" }); }}>
            <Minus className="w-4 h-4 mr-1" /> Debitează
          </Button>
          <Button onClick={() => { setManualDialog({ open: true, mode: "credit" }); setManualForm({ amount: "", reason: "", status: "available", customerEmail: "" }); }}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă credite
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{(walletStats?.totalAvailable || 0).toFixed(2)} RON</p>
            <p className="text-xs text-muted-foreground">Sold total disponibil</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{(walletStats?.totalPending || 0).toFixed(2)} RON</p>
            <p className="text-xs text-muted-foreground">Credite în așteptare</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{walletStats?.count || 0}</p>
            <p className="text-xs text-muted-foreground">Portofele active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Caută după email client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tip tranzacție" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Sumă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descriere</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nicio tranzacție.</TableCell></TableRow>
              ) : transactions.map((t: any) => {
                const profile = profileMap.get(t.customer_id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{profile?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email || t.customer_id?.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[t.type] || t.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${t.direction === "credit" ? "text-green-600" : "text-red-500"}`}>
                        {t.direction === "credit" ? "+" : "-"}{Number(t.amount).toFixed(2)} RON
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[t.status] || ""}`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.description}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manual Credit/Debit Dialog */}
      <Dialog open={manualDialog.open} onOpenChange={(v) => setManualDialog((d) => ({ ...d, open: v }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{manualDialog.mode === "credit" ? "Adaugă credite wallet" : "Debitează credite wallet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email client *</Label>
              <Input
                value={manualForm.customerEmail}
                onChange={(e) => setManualForm((f) => ({ ...f, customerEmail: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label>Sumă (RON) *</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={manualForm.amount}
                onChange={(e) => setManualForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            {manualDialog.mode === "credit" && (
              <div>
                <Label>Status credit</Label>
                <Select value={manualForm.status} onValueChange={(v) => setManualForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponibil (imediat)</SelectItem>
                    <SelectItem value="pending">În așteptare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Motiv / Notă</Label>
              <Textarea
                value={manualForm.reason}
                onChange={(e) => setManualForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Ex: Compensație client, corectare sold..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog({ open: false, mode: "credit" })}>Anulează</Button>
            <Button
              onClick={() => manualMutation.mutate()}
              disabled={manualMutation.isPending || !manualForm.amount || !manualForm.customerEmail}
              variant={manualDialog.mode === "debit" ? "destructive" : "default"}
            >
              {manualMutation.isPending ? "Se procesează..." : manualDialog.mode === "credit" ? "Adaugă credite" : "Debitează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
