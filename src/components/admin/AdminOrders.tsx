import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediat",
  delivered: "Livrat",
  cancelled: "Anulat",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, userEmail }: { id: string; status: string; userEmail?: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;

      // Send status update email
      if (userEmail) {
        try {
          await supabase.functions.invoke("send-email", {
            body: { type: "order_status", to: userEmail, data: { orderId: id, status } },
          });
        } catch (e) {
          console.error("Email notification failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status actualizat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o: any) => o.status === filterStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Comenzi ({orders.length})</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrează status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="pending">În așteptare</SelectItem>
              <SelectItem value="processing">În procesare</SelectItem>
              <SelectItem value="shipped">Expediat</SelectItem>
              <SelectItem value="delivered">Livrat</SelectItem>
              <SelectItem value="cancelled">Anulat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Produse</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.order_items?.map((item: any) => (
                          <p key={item.id} className="text-xs">
                            {item.products?.name} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{Number(order.total).toFixed(2)} RON</TableCell>
                    <TableCell className="text-sm capitalize">{order.payment_method || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateStatus.mutate({ id: order.id, status: value, userEmail: order.user_email })}
                      >
                        <SelectTrigger className="w-36">
                          <Badge className={statusColors[order.status] || ""}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nicio comandă găsită.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
