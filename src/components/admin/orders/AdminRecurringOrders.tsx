import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Pause, Play, XCircle, Calendar, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Săptămânal",
  biweekly: "La 2 săptămâni",
  monthly: "Lunar",
  bimonthly: "La 2 luni",
  quarterly: "La 3 luni",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminRecurringOrders() {
  const { format } = useCurrency();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [freqFilter, setFreqFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, products(name, image_url, price), profiles:customer_id(full_name)")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const filtered = subscriptions.filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (freqFilter !== "all" && s.frequency !== freqFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const name = s.profiles?.full_name?.toLowerCase() || "";
      const prodName = s.products?.name?.toLowerCase() || "";
      if (!name.includes(term) && !prodName.includes(term)) return false;
    }
    return true;
  });

  const activeSubs = subscriptions.filter((s: any) => s.status === "active");
  const expectedRevenue = activeSubs.reduce((sum: number, s: any) => {
    const price = s.products?.price || 0;
    const discounted = price * (1 - (s.discount_percent || 0) / 100);
    return sum + discounted * s.quantity;
  }, 0);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("subscriptions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Eroare la actualizare"); return; }
    toast.success(`Status actualizat: ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Comenzi Recurente (Abonamente)</h1>
          <p className="text-sm text-muted-foreground">Gestionare abonamente și comenzi automate.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{activeSubs.length}</p><p className="text-xs text-muted-foreground">Abonamente active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold">{format(expectedRevenue)}</p><p className="text-xs text-muted-foreground">Venit estimat / ciclu</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold">{subscriptions.filter((s: any) => s.status === "paused").length}</p><p className="text-xs text-muted-foreground">În pauză</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Caută client / produs..." value={search} onChange={e => setSearch(e.target.value)} className="w-60" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="active">Activ</SelectItem>
            <SelectItem value="paused">Pauzat</SelectItem>
            <SelectItem value="cancelled">Anulat</SelectItem>
          </SelectContent>
        </Select>
        <Select value={freqFilter} onValueChange={setFreqFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Frecvență" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate frecvențele</SelectItem>
            {Object.entries(FREQ_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Produs</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Frecvență</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Următoarea</TableHead>
                <TableHead>Reînnoiri</TableHead>
                <TableHead>Venit total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nu există abonamente.</TableCell></TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.profiles?.full_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {s.products?.image_url && <img src={s.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="text-sm truncate max-w-[150px]">{s.products?.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell className="text-sm">{FREQ_LABELS[s.frequency] || s.frequency}</TableCell>
                  <TableCell>{s.discount_percent > 0 ? `${s.discount_percent}%` : "—"}</TableCell>
                  <TableCell className="text-sm">{new Date(s.next_renewal_date).toLocaleDateString("ro-RO")}</TableCell>
                  <TableCell>{s.total_renewals}</TableCell>
                  <TableCell className="text-sm font-medium">{format(s.total_revenue || 0)}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[s.status] || ""}>{s.status === "active" ? "Activ" : s.status === "paused" ? "Pauzat" : "Anulat"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {s.status === "active" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Pauză" onClick={() => updateStatus(s.id, "paused")}>
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      {s.status === "paused" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Reia" onClick={() => updateStatus(s.id, "active")}>
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      {s.status !== "cancelled" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Anulează" onClick={() => updateStatus(s.id, "cancelled")}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
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
