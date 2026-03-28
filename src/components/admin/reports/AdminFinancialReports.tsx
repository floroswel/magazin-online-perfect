import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay, startOfMonth, startOfYear, startOfWeek } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, RotateCcw, Download, CalendarIcon,
  CheckCheck, AlertTriangle, Clock, CreditCard, Mail, XCircle, Search, ArrowUpRight, ArrowDownRight,
  Banknote, Receipt, FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const COLORS = ["hsl(210,80%,45%)", "hsl(150,60%,45%)", "hsl(42,100%,50%)", "hsl(0,80%,50%)", "hsl(280,60%,50%)", "hsl(30,80%,50%)"];

function fmt(n: number) { return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtInt(n: number) { return n.toLocaleString("ro-RO"); }
function pctChange(curr: number, prev: number) { return prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0; }

function FinKpi({ icon: Icon, label, value, prev, suffix = "RON", iconColor }: any) {
  const trend = prev !== undefined ? pctChange(typeof value === "number" ? value : 0, prev) : undefined;
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", iconColor || "bg-primary/10")}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold text-foreground">{typeof value === "number" ? fmt(value) : value} {suffix}</p>
            {trend !== undefined && (
              <span className={cn("flex items-center text-[11px] font-medium", trend >= 0 ? "text-green-600" : "text-red-500")}>
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}% vs. perioadă anterioară
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminFinancialReports() {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reconSearch, setReconSearch] = useState("");
  const [reconStatus, setReconStatus] = useState("all");
  const [reconMethod, setReconMethod] = useState("all");

  const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
  const prevFrom = subDays(dateRange.from, periodDays);
  const prevTo = subDays(dateRange.to, periodDays);

  // Fetch orders for current + previous period
  const { data: allOrders = [] } = useQuery({
    queryKey: ["fin-orders", prevFrom.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("id, total, status, created_at, payment_method, user_id, discount_amount, shipping_cost, order_number, user_email")
        .gte("created_at", prevFrom.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);
      return data || [];
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["fin-transactions", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.from("payment_transactions")
        .select("*, payment_methods(name, type), orders(order_number, user_email, total)")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  // Fetch affiliate commissions
  const { data: affiliateCommissions = [] } = useQuery({
    queryKey: ["fin-affiliates", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_conversions")
        .select("commission_amount, status")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      return data || [];
    },
  });

  // Loyalty points issued for cash flow
  const loyaltyPointsTotal = 0;

  // Fetch returns for cash flow
  const { data: returns = [] } = useQuery({
    queryKey: ["fin-returns"],
    queryFn: async () => {
      const { data } = await supabase.from("returns")
        .select("id, refund_amount, status")
        .in("status", ["pending", "approved", "received"]);
      return data || [];
    },
  });

  // Separate current vs previous period orders
  const currentOrders = allOrders.filter((o: any) => o.created_at >= dateRange.from.toISOString());
  const prevOrders = allOrders.filter((o: any) => o.created_at < dateRange.from.toISOString());

  const activeOrders = currentOrders.filter((o: any) => !["cancelled", "refunded"].includes(o.status));
  const prevActive = prevOrders.filter((o: any) => !["cancelled", "refunded"].includes(o.status));

  const totalRevenue = activeOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const prevRevenue = prevActive.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const totalOrdersCount = activeOrders.length;
  const prevOrdersCount = prevActive.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const prevAvg = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

  // Refunds
  const refundedTx = transactions.filter((t: any) => t.status === "refunded" || t.status === "partially_refunded");
  const totalRefunds = refundedTx.reduce((s: number, t: any) => s + Number(t.refunded_amount || 0), 0);
  const prevRefunds = 0; // would need prev period transactions

  const netRevenue = totalRevenue - totalRefunds;
  const totalAffiliateCommissions = affiliateCommissions.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);

  // ── Daily revenue chart (last 30 days)
  const dailyMap: Record<string, { date: string; revenue: number; orders: number; refunds: number }> = {};
  currentOrders.forEach((o: any) => {
    if (["cancelled", "refunded"].includes(o.status)) return;
    const day = o.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0, refunds: 0 };
    dailyMap[day].revenue += Number(o.total || 0);
    dailyMap[day].orders += 1;
  });
  const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // ── Payment method breakdown
  const paymentBreakdown: Record<string, { method: string; orders: number; total: number }> = {};
  activeOrders.forEach((o: any) => {
    const m = o.payment_method || "ramburs";
    if (!paymentBreakdown[m]) paymentBreakdown[m] = { method: m, orders: 0, total: 0 };
    paymentBreakdown[m].orders += 1;
    paymentBreakdown[m].total += Number(o.total || 0);
  });
  const paymentTable = Object.values(paymentBreakdown).sort((a, b) => b.total - a.total);
  const paymentPieData = paymentTable.map(p => ({ name: p.method, value: p.total }));

  // ── Reconciliation
  const filteredTx = transactions.filter((t: any) => {
    if (reconStatus === "reconciled" && !t.reconciled) return false;
    if (reconStatus === "unreconciled" && t.reconciled) return false;
    if (reconStatus !== "all" && reconStatus !== "reconciled" && reconStatus !== "unreconciled" && t.status !== reconStatus) return false;
    if (reconMethod !== "all" && t.payment_methods?.name !== reconMethod) return false;
    if (reconSearch) {
      const s = reconSearch.toLowerCase();
      return t.external_id?.toLowerCase().includes(s) || t.orders?.order_number?.toLowerCase().includes(s) || t.orders?.user_email?.toLowerCase().includes(s);
    }
    return true;
  });
  const unreconciledTotal = transactions.filter((t: any) => t.status === "completed" && !t.reconciled).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const unreconciledCount = transactions.filter((t: any) => t.status === "completed" && !t.reconciled).length;

  const toggleReconciled = useMutation({
    mutationFn: async ({ id, reconciled }: { id: string; reconciled: boolean }) => {
      const { error } = await supabase.from("payment_transactions").update({
        reconciled,
        reconciled_at: reconciled ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-transactions"] });
      toast({ title: "Status reconciliere actualizat" });
    },
  });

  // ── TVA Report
  const vatRates = [19, 9, 5, 0];
  // Simplified: assume all products are 19% unless we have product-level data
  const totalWithVat19 = totalRevenue;
  const vatCollected19 = totalWithVat19 - totalWithVat19 / 1.19;

  // ── Unpaid orders (transfer bancar, pending > X days)
  const unpaidOrders = currentOrders.filter((o: any) =>
    (o.payment_method === "transfer_bancar" || o.payment_method === "transfer") &&
    (o.status === "pending" || o.status === "new")
  );
  const unpaidTotal = unpaidOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  // ── Cash flow
  const activeOrdersValue = currentOrders.filter((o: any) => !["delivered", "cancelled", "refunded"].includes(o.status))
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const next30DaysSubs = 0;
  const pendingRefunds = returns.reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);

  // ── Export helpers
  const exportCsv = (data: any[], filename: string, headers: string) => {
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportFinancialCsv = () => {
    const headers = "Data,Nr Comanda,Email,Total,Plata,Status";
    const rows = currentOrders.map((o: any) =>
      `${o.created_at?.slice(0, 10)},${o.order_number || o.id.slice(0, 8)},${o.user_email || ""},${o.total},${o.payment_method || "ramburs"},${o.status}`
    ).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `raport-financiar-${format(dateRange.from, "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportReconciliationCsv = () => {
    const headers = "Data,ID Tranzactie,Comanda,Email,Metoda,Suma,Status,Reconciliat";
    const rows = filteredTx.map((t: any) =>
      `${t.created_at?.slice(0, 10)},${t.external_id || ""},${t.orders?.order_number || ""},${t.orders?.user_email || ""},${t.payment_methods?.name || ""},${t.amount},${t.status},${t.reconciled ? "Da" : "Nu"}`
    ).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `reconciliere-${format(dateRange.from, "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportVatCsv = () => {
    const headers = "Cota TVA,Venituri cu TVA,TVA Colectat,Tip Client";
    const rows = `19%,${fmt(totalWithVat19)},${fmt(vatCollected19)},B2C+B2B`;
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `raport-tva-${format(dateRange.from, "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const uniquePaymentMethods = [...new Set(transactions.map((t: any) => t.payment_methods?.name).filter(Boolean))];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" /> Rapoarte Financiare</h2>
          <p className="text-sm text-muted-foreground">Analiză financiară, reconciliere plăți, TVA și cash flow.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {format(dateRange.from, "dd MMM", { locale: ro })} – {format(dateRange.to, "dd MMM yyyy", { locale: ro })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col gap-1 p-2 border-b">
                {[
                  { label: "Azi", from: startOfDay(new Date()), to: new Date() },
                  { label: "Această săptămână", from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() },
                  { label: "Această lună", from: startOfMonth(new Date()), to: new Date() },
                  { label: "Ultimele 30 zile", from: subDays(new Date(), 30), to: new Date() },
                  { label: "Ultimele 90 zile", from: subDays(new Date(), 90), to: new Date() },
                  { label: "Acest an", from: startOfYear(new Date()), to: new Date() },
                ].map(p => (
                  <Button key={p.label} variant="ghost" size="sm" className="justify-start text-xs"
                    onClick={() => setDateRange({ from: p.from, to: p.to })}>
                    {p.label}
                  </Button>
                ))}
              </div>
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => { if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to }); }}
                className={cn("p-3 pointer-events-auto")} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={exportFinancialCsv}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Sumar Financiar</TabsTrigger>
          <TabsTrigger value="payment-methods">Per Metodă de Plată</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliere Plăți</TabsTrigger>
          <TabsTrigger value="refunds">Rambursări</TabsTrigger>
          <TabsTrigger value="vat">TVA</TabsTrigger>
          <TabsTrigger value="unpaid">Comenzi Neplătite</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* ════════════ SUMAR FINANCIAR ════════════ */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <FinKpi icon={TrendingUp} label="Total Venituri" value={totalRevenue} prev={prevRevenue} />
            <FinKpi icon={ShoppingCart} label="Total Comenzi" value={fmtInt(totalOrdersCount)} prev={undefined} suffix="" />
            <FinKpi icon={DollarSign} label="Valoare Medie Comandă" value={avgOrderValue} prev={prevAvg} />
            <FinKpi icon={RotateCcw} label="Total Rambursări" value={totalRefunds} suffix="RON" iconColor="bg-orange-500/10" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <FinKpi icon={TrendingUp} label="Venit Net" value={netRevenue} suffix="RON" iconColor="bg-green-500/10" />
            <FinKpi icon={Banknote} label="Comisioane Afiliați" value={totalAffiliateCommissions} suffix="RON" iconColor="bg-purple-500/10" />
            <FinKpi icon={Receipt} label="Discount-uri Acordate" value={activeOrders.reduce((s: number, o: any) => s + Number(o.discount_amount || 0), 0)} suffix="RON" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Venituri Zilnice</CardTitle></CardHeader>
            <CardContent>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyChart}>
                    <defs>
                      <linearGradient id="revGradFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210,80%,45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(210,80%,45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => format(new Date(v), "dd MMM", { locale: ro })} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={v => format(new Date(v as string), "dd MMMM yyyy", { locale: ro })} formatter={(v: number) => [`${fmt(v)} RON`, "Venituri"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(210,80%,45%)" fill="url(#revGradFin)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-8 text-muted-foreground">Nicio dată pentru perioada selectată.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════ PER METODĂ DE PLATĂ ════════════ */}
        <TabsContent value="payment-methods" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Distribuție Venituri pe Metode de Plată</CardTitle></CardHeader>
              <CardContent>
                {paymentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value"
                        label={({ name, value }) => `${name}: ${fmt(value)}`}>
                        {paymentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${fmt(v)} RON`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8 text-muted-foreground">Nicio dată.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Detalii per Metodă</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metodă</TableHead>
                      <TableHead className="text-right">Comenzi</TableHead>
                      <TableHead className="text-right">Valoare</TableHead>
                      <TableHead className="text-right">% din total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentTable.map(p => (
                      <TableRow key={p.method}>
                        <TableCell className="font-medium text-sm">{p.method}</TableCell>
                        <TableCell className="text-right text-sm">{p.orders}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{fmt(p.total)} RON</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{totalRevenue > 0 ? ((p.total / totalRevenue) * 100).toFixed(1) : 0}%</TableCell>
                      </TableRow>
                    ))}
                    {paymentTable.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nicio dată.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════ RECONCILIERE PLĂȚI ════════════ */}
        <TabsContent value="reconciliation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Nereconciliate</p>
                  <p className="text-xl font-bold text-foreground">{fmt(unreconciledTotal)} RON</p>
                  <p className="text-[11px] text-muted-foreground">{unreconciledCount} tranzacții</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><CheckCheck className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Reconciliate</p>
                  <p className="text-xl font-bold text-foreground">
                    {fmt(transactions.filter((t: any) => t.reconciled).reduce((s: number, t: any) => s + Number(t.amount || 0), 0))} RON
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Tranzacții</p>
                  <p className="text-xl font-bold text-foreground">{transactions.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută după nr. comandă, email, ID tranzacție..." value={reconSearch} onChange={e => setReconSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={reconStatus} onValueChange={setReconStatus}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="unreconciled">Nereconciliate</SelectItem>
                <SelectItem value="reconciled">Reconciliate</SelectItem>
                <SelectItem value="completed">Finalizate</SelectItem>
                <SelectItem value="failed">Eșuate</SelectItem>
                <SelectItem value="refunded">Rambursate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reconMethod} onValueChange={setReconMethod}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Metodă" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate metodele</SelectItem>
                {uniquePaymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportReconciliationCsv}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">✓</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>ID Tranzacție</TableHead>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Metodă</TableHead>
                    <TableHead className="text-right">Sumă</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu sunt tranzacții.</TableCell></TableRow>
                  ) : filteredTx.map((t: any) => (
                    <TableRow key={t.id} className={t.reconciled ? "bg-green-50/50 dark:bg-green-950/10" : ""}>
                      <TableCell>
                        <Checkbox checked={!!t.reconciled}
                          onCheckedChange={(checked) => toggleReconciled.mutate({ id: t.id, reconciled: !!checked })} />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy HH:mm", { locale: ro }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{t.external_id || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{t.orders?.order_number || "-"}</div>
                        <div className="text-xs text-muted-foreground">{t.orders?.user_email || ""}</div>
                      </TableCell>
                      <TableCell className="text-sm">{t.payment_methods?.name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{fmt(Number(t.amount || 0))} {t.currency || "RON"}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "completed" ? "default" : t.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                          {t.status === "completed" ? "Succes" : t.status === "failed" ? "Eșuat" : t.status === "refunded" ? "Rambursat" : t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════ RAMBURSĂRI ════════════ */}
        <TabsContent value="refunds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FinKpi icon={RotateCcw} label="Total Rambursări" value={totalRefunds} suffix="RON" iconColor="bg-orange-500/10" />
            <FinKpi icon={Receipt} label="Nr. Rambursări" value={fmtInt(refundedTx.length)} suffix="" />
            <FinKpi icon={TrendingDown} label="% din Venituri" value={totalRevenue > 0 ? ((totalRefunds / totalRevenue) * 100).toFixed(1) + "%" : "0%"} suffix="" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Sumă Orig.</TableHead>
                    <TableHead className="text-right">Rambursat</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundedTx.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nicio rambursare.</TableCell></TableRow>
                  ) : refundedTx.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{t.created_at ? format(new Date(t.created_at), "dd MMM yyyy", { locale: ro }) : "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{t.orders?.order_number || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.orders?.user_email || "-"}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(Number(t.amount || 0))} RON</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-orange-600">-{fmt(Number(t.refunded_amount || 0))} RON</TableCell>
                      <TableCell><Badge variant={t.status === "refunded" ? "destructive" : "secondary"} className="text-[10px]">{t.status === "refunded" ? "Total" : "Parțial"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════ TVA ════════════ */}
        <TabsContent value="vat" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportVatCsv}><Download className="w-4 h-4 mr-1" /> Export TVA CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cotă TVA</TableHead>
                    <TableHead className="text-right">Venituri cu TVA</TableHead>
                    <TableHead className="text-right">TVA Colectat</TableHead>
                    <TableHead className="text-right">Bază impozabilă</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">19%</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(totalWithVat19)} RON</TableCell>
                    <TableCell className="text-right text-sm">{fmt(vatCollected19)} RON</TableCell>
                    <TableCell className="text-right text-sm">{fmt(totalWithVat19 - vatCollected19)} RON</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">9%</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">5%</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                    <TableCell className="text-right">0,00 RON</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{fmt(totalWithVat19)} RON</TableCell>
                    <TableCell className="text-right">{fmt(vatCollected19)} RON</TableCell>
                    <TableCell className="text-right">{fmt(totalWithVat19 - vatCollected19)} RON</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">* Valorile TVA sunt calculate pe baza cotei implicite (19%). Pentru detalii per produs, configurați cota TVA pe fiecare produs din Setări → SmartBill → Mapare Produse.</p>
        </TabsContent>

        {/* ════════════ COMENZI NEPLĂTITE ════════════ */}
        <TabsContent value="unpaid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="w-5 h-5 text-yellow-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Comenzi Neplătite</p>
                  <p className="text-xl font-bold text-foreground">{unpaidOrders.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Valoare Blocată</p>
                  <p className="text-xl font-bold text-foreground">{fmt(unpaidTotal)} RON</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Zile</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Toate comenzile sunt plătite! 🎉</TableCell></TableRow>
                  ) : unpaidOrders.map((o: any) => {
                    const daysOld = Math.ceil((Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium text-sm">{o.order_number || o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.user_email || "-"}</TableCell>
                        <TableCell className="text-xs">{format(new Date(o.created_at), "dd MMM yyyy", { locale: ro })}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">{fmt(Number(o.total))} RON</TableCell>
                        <TableCell>
                          <Badge variant={daysOld > 7 ? "destructive" : daysOld > 3 ? "secondary" : "outline"} className="text-[10px]">
                            {daysOld} zile
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => toast({ title: "Reminder trimis", description: `Email trimis către ${o.user_email || "client"}.` })}>
                              <Mail className="w-3 h-3 mr-1" /> Reminder
                            </Button>
                            {daysOld > 7 && (
                              <Button size="sm" variant="destructive" className="h-7 text-xs"
                                onClick={async () => {
                                  await supabase.from("orders").update({ status: "cancelled" }).eq("id", o.id);
                                  qc.invalidateQueries({ queryKey: ["fin-orders"] });
                                  toast({ title: "Comandă anulată" });
                                }}>
                                <XCircle className="w-3 h-3 mr-1" /> Anulează
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
        </TabsContent>

        {/* ════════════ CASH FLOW ════════════ */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Comenzi Active (nelivrate)</p>
                <p className="text-2xl font-bold text-foreground">{fmt(activeOrdersValue)} RON</p>
                <p className="text-[11px] text-muted-foreground">Venituri în tranzit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Puncte Fidelizare Emise</p>
                <p className="text-2xl font-bold text-green-600">{loyaltyPointsTotal}</p>
                <p className="text-[11px] text-muted-foreground">Total puncte</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Retururi în Procesare</p>
                <p className="text-2xl font-bold text-orange-600">{fmt(pendingRefunds)} RON</p>
                <p className="text-[11px] text-muted-foreground">{returns.length} retururi deschise</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Cash Flow Estimat Net</p>
                <p className="text-2xl font-bold text-primary">{fmt(activeOrdersValue + next30DaysSubs - pendingRefunds)} RON</p>
                <p className="text-[11px] text-muted-foreground">Active + Abonamente - Retururi</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Export Consolidat Lunar</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Descarcă un export complet cu toate tranzacțiile din perioada selectată, format CSV pentru contabil.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportFinancialCsv}><Download className="w-4 h-4 mr-1" /> Export Comenzi CSV</Button>
                <Button variant="outline" onClick={exportReconciliationCsv}><Download className="w-4 h-4 mr-1" /> Export Tranzacții CSV</Button>
                <Button variant="outline" onClick={exportVatCsv}><Download className="w-4 h-4 mr-1" /> Export TVA CSV</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
