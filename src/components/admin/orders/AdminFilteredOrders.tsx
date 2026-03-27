import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Package, Search, RotateCcw, Eye, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const STATUS_MAP: Record<string, string> = {
  new: "pending",
  processing: "processing",
  shipping: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface Props {
  status: string;
  title: string;
  description: string;
}

export default function AdminFilteredOrders({ status, title, description }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const dbStatus = STATUS_MAP[status] || status;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["filtered-orders", dbStatus],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(quantity)")
        .eq("status", dbStatus)
        .order("created_at", { ascending: false })
        .limit(500);
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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const restoreOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "pending" }).eq("id", orderId);
    await supabase.from("order_timeline").insert({
      order_id: orderId, action: "status_change", old_status: "cancelled", new_status: "pending", note: "Restaurat de admin",
    });
    queryClient.invalidateQueries({ queryKey: ["filtered-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Comandă restaurată!");
  };

  const exportCSV = () => {
    const rows = [["ID", "Nr.", "Client", "Email", "Total", "Data"]];
    filtered.forEach((o: any) => {
      rows.push([o.id.slice(0, 8), o.order_number || "", (o.shipping_address as any)?.full_name || "", o.user_email || "", String(o.total), format(new Date(o.created_at), "yyyy-MM-dd HH:mm")]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `comenzi-${dbStatus}.csv`; a.click();
    toast.success(`${filtered.length} comenzi exportate`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} comenzi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută ID, nume, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nu sunt comenzi cu statusul „{title}"</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Produse</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    {dbStatus === "cancelled" && <TableHead>Acțiuni</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-mono text-xs">#{order.order_number || order.id.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{(order.shipping_address as any)?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{order.user_email || ""}</p>
                      </TableCell>
                      <TableCell className="text-sm">{order.order_items?.length || 0}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(order.total).toLocaleString("ro-RO")} RON</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[order.status] || ""}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd MMM yyyy", { locale: ro })}
                      </TableCell>
                      {dbStatus === "cancelled" && (
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => restoreOrder(order.id)}>
                            <RotateCcw className="w-3 h-3" />Restaurează
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">Pagina {page + 1} din {totalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>›</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
