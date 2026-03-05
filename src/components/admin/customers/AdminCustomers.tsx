import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, ShoppingCart, Award, Download, Eye, ArrowLeft } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface Customer {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  loyalty_points: number;
}

interface CustomerOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string;
  total: number;
  payment_method: string | null;
  items_count: number;
}

const statusLabels: Record<string, string> = {
  pending: "În așteptare", processing: "În procesare", shipped: "Expediat",
  delivered: "Livrat", cancelled: "Anulat", refunded: "Rambursat",
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: orders } = await supabase.from("orders").select("user_id, user_email, total, created_at");
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone, created_at");
      const { data: loyalty } = await supabase.from("loyalty_points").select("user_id, points");

      const userMap = new Map<string, Customer>();
      orders?.forEach((o) => {
        const existing = userMap.get(o.user_id);
        if (existing) { existing.order_count++; existing.total_spent += Number(o.total); }
        else { userMap.set(o.user_id, { user_id: o.user_id, email: o.user_email || "—", full_name: null, phone: null, created_at: o.created_at, order_count: 1, total_spent: Number(o.total), loyalty_points: 0 }); }
      });
      profiles?.forEach((p) => {
        if (!userMap.has(p.user_id)) {
          userMap.set(p.user_id, { user_id: p.user_id, email: "—", full_name: p.full_name, phone: p.phone, created_at: p.created_at, order_count: 0, total_spent: 0, loyalty_points: 0 });
        } else {
          const c = userMap.get(p.user_id)!;
          c.full_name = p.full_name;
          c.phone = p.phone;
        }
      });
      loyalty?.forEach((l) => { const c = userMap.get(l.user_id); if (c) c.loyalty_points += l.points; });
      setCustomers(Array.from(userMap.values()).sort((a, b) => b.total_spent - a.total_spent));
      setLoading(false);
    };
    fetch();
  }, []);

  const viewCustomerOrders = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, created_at, status, total, payment_method, order_items(id)")
      .eq("user_id", customer.user_id)
      .order("created_at", { ascending: false });
    setCustomerOrders((data || []).map((o: any) => ({ ...o, items_count: o.order_items?.length || 0 })));
    setLoadingOrders(false);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.email.toLowerCase().includes(q) || (c.full_name || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
  });

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0);

  const exportCSV = () => {
    const header = "Nume,Email,Telefon,Comenzi,Total cheltuit,Puncte fidelitate\n";
    const rows = filtered.map((c) => `"${c.full_name || "—"}","${c.email}","${c.phone || "—"}",${c.order_count},${c.total_spent.toFixed(2)},${c.loyalty_points}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clienti.csv"; a.click();
  };

  const getSegment = (c: Customer) => {
    if (c.total_spent >= 5000) return { label: "VIP", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    if (c.order_count >= 5) return { label: "Fidel", color: "bg-primary/20 text-primary border-primary/30" };
    if (c.order_count === 0) return { label: "Nou", color: "bg-muted text-muted-foreground border-border" };
    return { label: "Activ", color: "bg-green-500/20 text-green-400 border-green-500/30" };
  };

  // Customer stats
  const customerStats = selectedCustomer ? {
    avgOrder: selectedCustomer.order_count > 0 ? selectedCustomer.total_spent / selectedCustomer.order_count : 0,
    firstOrder: customerOrders.length > 0 ? customerOrders[customerOrders.length - 1]?.created_at : null,
    lastOrder: customerOrders.length > 0 ? customerOrders[0]?.created_at : null,
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clienți</h1>
          <p className="text-sm text-muted-foreground">Vizualizare și gestionare bază de clienți</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{customers.length}</p><p className="text-sm text-muted-foreground">Total clienți</p></div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-green-500" /></div>
            <div><p className="text-2xl font-bold text-foreground">{totalOrders}</p><p className="text-sm text-muted-foreground">Total comenzi</p></div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Award className="w-6 h-6 text-yellow-500" /></div>
            <div><p className="text-2xl font-bold text-foreground">{totalRevenue.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} lei</p><p className="text-sm text-muted-foreground">Venituri totale</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută client (nume, email, telefon)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">Niciun client găsit.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Comenzi</TableHead>
                  <TableHead className="text-right">Total cheltuit</TableHead>
                  <TableHead className="text-right">Puncte</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const seg = getSegment(c);
                  return (
                    <TableRow key={c.user_id} className="border-border">
                      <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{c.order_count}</TableCell>
                      <TableCell className="text-right font-mono">{c.total_spent.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</TableCell>
                      <TableCell className="text-right font-mono">{c.loyalty_points}</TableCell>
                      <TableCell><Badge className={seg.color}>{seg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewCustomerOrders(c)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer profile + order history dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={open => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Profil client: {selectedCustomer.full_name || selectedCustomer.email}</DialogTitle>
              </DialogHeader>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card><CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{selectedCustomer.order_count}</p>
                  <p className="text-[10px] text-muted-foreground">Total comenzi</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{selectedCustomer.total_spent.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</p>
                  <p className="text-[10px] text-muted-foreground">Total cheltuit</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{customerStats?.avgOrder?.toLocaleString("ro-RO", { minimumFractionDigits: 2 }) || "0"} lei</p>
                  <p className="text-[10px] text-muted-foreground">Valoare medie comandă</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{selectedCustomer.loyalty_points}</p>
                  <p className="text-[10px] text-muted-foreground">Puncte fidelitate</p>
                </CardContent></Card>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-muted-foreground">Prima comandă:</span>{" "}
                  <span className="font-medium">{customerStats?.firstOrder ? format(new Date(customerStats.firstOrder), "dd MMM yyyy", { locale: ro }) : "—"}</span>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-muted-foreground">Ultima comandă:</span>{" "}
                  <span className="font-medium">{customerStats?.lastOrder ? format(new Date(customerStats.lastOrder), "dd MMM yyyy", { locale: ro }) : "—"}</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold mb-2">Istoric comenzi</h3>
              {loadingOrders ? (
                <p className="text-center text-muted-foreground py-4">Se încarcă...</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comandă</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Produse</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Plată</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">#{o.order_number || o.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-xs">{format(new Date(o.created_at), "dd.MM.yy HH:mm")}</TableCell>
                          <TableCell className="text-xs text-center">{o.items_count}</TableCell>
                          <TableCell className="text-xs font-medium">{Number(o.total).toFixed(2)} RON</TableCell>
                          <TableCell className="text-xs capitalize">{o.payment_method || "ramburs"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{statusLabels[o.status] || o.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {customerOrders.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nicio comandă.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
