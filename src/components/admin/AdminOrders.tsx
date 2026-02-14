import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin, CreditCard, Gift, Download, CalendarIcon } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url, slug))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, userEmail }: { id: string; status: string; userEmail?: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;

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

  const filtered = orders.filter((o: any) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    const orderDate = new Date(o.created_at);
    if (dateFrom && orderDate < startOfDay(dateFrom)) return false;
    if (dateTo && orderDate > endOfDay(dateTo)) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedOrder((prev) => (prev === id ? null : id));
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nu există comenzi de exportat.");
      return;
    }

    const rows: string[][] = [
      ["ID Comandă", "Data", "Client Email", "Status", "Total (RON)", "Discount (RON)", "Metoda Plată", "Puncte Fidelitate", "Produse", "Adresă Livrare"],
    ];

    filtered.forEach((order: any) => {
      const address = order.shipping_address as any;
      const items = (order.order_items || [])
        .map((i: any) => `${i.products?.name || "Produs șters"} x${i.quantity}`)
        .join("; ");
      const addr = address
        ? `${address.full_name}, ${address.address}, ${address.city}, ${address.county} ${address.postal_code || ""}, Tel: ${address.phone}`
        : "";

      rows.push([
        order.id,
        format(new Date(order.created_at), "yyyy-MM-dd HH:mm"),
        order.user_email || "",
        statusLabels[order.status] || order.status,
        Number(order.total).toFixed(2),
        Number(order.discount_amount || 0).toFixed(2),
        order.payment_method || "ramburs",
        String(order.loyalty_points_earned || 0),
        items,
        addr,
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comenzi-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} comenzi exportate!`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Comenzi ({orders.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: ro }) : "De la"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateTo ? format(dateTo, "dd MMM yyyy", { locale: ro }) : "Până la"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>✕</Button>
            )}
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
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order: any) => {
              const isExpanded = expandedOrder === order.id;
              const address = order.shipping_address as any;
              const installments = order.payment_installments as any;

              return (
                <Collapsible key={order.id} open={isExpanded} onOpenChange={() => toggleExpand(order.id)}>
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                            <p className="text-sm font-medium">
                              {format(new Date(order.created_at), "dd MMM yyyy", { locale: ro })}
                            </p>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground text-xs">Client</p>
                            <p className="truncate">{order.user_email || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Produse</p>
                            <p className="text-sm">{order.order_items?.length || 0} articole</p>
                          </div>
                          <div>
                            <p className="font-semibold">{Number(order.total).toFixed(2)} RON</p>
                            {order.discount_amount > 0 && (
                              <p className="text-xs text-green-600">-{Number(order.discount_amount).toFixed(2)} discount</p>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateStatus.mutate({ id: order.id, status: value, userEmail: order.user_email })}
                            >
                              <SelectTrigger className="w-36 h-8">
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
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 p-4 space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Produse comandate</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produs</TableHead>
                                <TableHead className="text-center">Cantitate</TableHead>
                                <TableHead className="text-right">Preț unitar</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.order_items?.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {item.products?.image_url && (
                                        <img src={item.products.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                                      )}
                                      <span className="text-sm">{item.products?.name || "Produs șters"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right text-sm">{Number(item.price).toFixed(2)} RON</TableCell>
                                  <TableCell className="text-right font-medium">{(Number(item.price) * item.quantity).toFixed(2)} RON</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          {/* Shipping Address */}
                          {address && (
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold flex items-center gap-1"><MapPin className="w-4 h-4" /> Adresă livrare</h4>
                              <div className="text-sm text-muted-foreground">
                                <p>{address.full_name}</p>
                                <p>{address.address}</p>
                                <p>{address.city}, {address.county} {address.postal_code}</p>
                                <p>📞 {address.phone}</p>
                              </div>
                            </div>
                          )}

                          {/* Payment Info */}
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold flex items-center gap-1"><CreditCard className="w-4 h-4" /> Plată</h4>
                            <div className="text-sm text-muted-foreground">
                              <p className="capitalize">{order.payment_method || "Ramburs"}</p>
                              {installments && (
                                <p className="text-xs mt-1">
                                  {installments.count} rate × {Number(installments.monthlyAmount).toFixed(2)} RON
                                  <br />via {installments.provider}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Loyalty & Discount */}
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold flex items-center gap-1"><Gift className="w-4 h-4" /> Extra</h4>
                            <div className="text-sm text-muted-foreground">
                              {order.loyalty_points_earned > 0 && (
                                <p>+{order.loyalty_points_earned} puncte fidelitate</p>
                              )}
                              {order.discount_amount > 0 && (
                                <p>Discount: -{Number(order.discount_amount).toFixed(2)} RON</p>
                              )}
                              <p className="text-xs mt-1">
                                Comandat: {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Nicio comandă găsită.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
