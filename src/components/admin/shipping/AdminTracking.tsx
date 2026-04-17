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
import { Search, Package, Truck, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "În așteptare", icon: Clock, color: "text-yellow-600" },
  picked_up: { label: "Ridicat", icon: Truck, color: "text-blue-600" },
  in_transit: { label: "În tranzit", icon: Truck, color: "text-primary" },
  out_for_delivery: { label: "În livrare", icon: MapPin, color: "text-purple-600" },
  delivered: { label: "Livrat", icon: CheckCircle2, color: "text-green-600" },
  failed: { label: "Eșuat", icon: XCircle, color: "text-destructive" },
  returned: { label: "Returnat", icon: AlertCircle, color: "text-orange-600" },
};

export default function AdminTracking() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // We'll pull orders with shipping data
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, user_email, shipping_status, shipping_address, status, created_at, updated_at, total")
        .in("status", ["confirmed", "processing", "shipped", "delivered"])
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders.filter((o: any) => {
    if (statusFilter !== "all" && o.shipping_status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(s) ||
        o.user_email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    inTransit: orders.filter((o: any) => o.shipping_status === "in_transit" || o.shipping_status === "picked_up").length,
    outForDelivery: orders.filter((o: any) => o.shipping_status === "out_for_delivery").length,
    delivered: orders.filter((o: any) => o.shipping_status === "delivered").length,
    issues: orders.filter((o: any) => o.shipping_status === "failed" || o.shipping_status === "returned").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tracking Livrări</h1>
        <p className="text-sm text-muted-foreground">Urmărire comenzi și status livrare în timp real.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.inTransit}</p>
          <p className="text-xs text-muted-foreground">În tranzit</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.outForDelivery}</p>
          <p className="text-xs text-muted-foreground">În livrare</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          <p className="text-xs text-muted-foreground">Livrate</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.issues}</p>
          <p className="text-xs text-muted-foreground">Probleme</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută după nr. comandă sau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="picked_up">Ridicat</SelectItem>
            <SelectItem value="in_transit">În tranzit</SelectItem>
            <SelectItem value="out_for_delivery">În livrare</SelectItem>
            <SelectItem value="delivered">Livrat</SelectItem>
            <SelectItem value="failed">Eșuat</SelectItem>
            <SelectItem value="returned">Returnat</SelectItem>
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
              <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nu sunt comenzi cu status de livrare.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Destinație</TableHead>
                  <TableHead className="text-right">Valoare</TableHead>
                  <TableHead>Status livrare</TableHead>
                  <TableHead>Actualizat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o: any) => {
                  const sc = statusConfig[o.shipping_status] || statusConfig.pending;
                  const Icon = sc.icon;
                  const addr = o.shipping_address as any;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-sm">{o.order_number || o.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.user_email || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {addr ? `${addr.city || ""}, ${addr.county || ""}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">{Number(o.total).toLocaleString("ro-RO")} RON</TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {o.updated_at ? format(new Date(o.updated_at), "dd MMM, HH:mm", { locale: ro }) : "-"}
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
