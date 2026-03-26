import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Mail, Trash2, Save, BellRing } from "lucide-react";
import { toast } from "sonner";

export default function AdminBackInStock() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({ enabled: true, auto_send: true, email_subject: "Produsul dorit este din nou în stoc!", max_notifications_per_product: 500 });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-restock-notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("restock_notifications").select("*, products(name, slug, image_url, stock)").order("created_at", { ascending: false }).limit(200);
      return (data as any[]) || [];
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("restock_notifications").delete().eq("id", id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-restock-notifications"] }); toast.success("Notificare ștearsă"); },
  });

  const sendNotifications = async (productId: string) => {
    const pending = notifications.filter((n: any) => n.product_id === productId && !n.notified);
    for (const n of pending) {
      await supabase.from("restock_notifications").update({ notified: true, notified_at: new Date().toISOString() }).eq("id", n.id);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-restock-notifications"] });
    toast.success(`${pending.length} notificări trimise!`);
  };

  const pending = notifications.filter((n: any) => !n.notified);
  const sent = notifications.filter((n: any) => n.notified);

  const productGroups = pending.reduce((acc: Record<string, any[]>, n: any) => {
    const pid = n.product_id;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BellRing className="w-5 h-5" /> Back in Stock / Waitlist</h1>
          <p className="text-sm text-muted-foreground">Gestionează notificările de restocare. Clienții se abonează și primesc email automat.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bell className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{notifications.length}</p><p className="text-xs text-muted-foreground">Total abonări</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="w-8 h-8 text-amber-500" /><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">În așteptare</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bell className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{sent.length}</p><p className="text-xs text-muted-foreground">Trimise</p></div></div></CardContent></Card>
      </div>

      {Object.keys(productGroups).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Produse cu clienți în așteptare</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Produs</TableHead><TableHead>Stoc actual</TableHead><TableHead>Abonați</TableHead><TableHead className="w-32">Acțiuni</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(productGroups).map(([pid, items]) => {
                  const product = (items[0] as any).products;
                  return (
                    <TableRow key={pid}>
                      <TableCell className="font-medium">{product?.name || pid}</TableCell>
                      <TableCell>
                        <Badge variant={(product?.stock || 0) > 0 ? "default" : "destructive"}>
                          {product?.stock || 0} buc
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{items.length} persoane</Badge></TableCell>
                      <TableCell>
                        {(product?.stock || 0) > 0 && (
                          <Button size="sm" onClick={() => sendNotifications(pid)}>
                            <Mail className="w-3.5 h-3.5 mr-1" /> Trimite
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Toate abonările</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Produs</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : notifications.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nicio abonare la notificări.</TableCell></TableRow>
              ) : notifications.map((n: any) => (
                <TableRow key={n.id}>
                  <TableCell className="text-sm">{n.email}</TableCell>
                  <TableCell className="text-sm">{n.products?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={n.notified ? "default" : "secondary"}>
                      {n.notified ? "Notificat" : "În așteptare"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("ro-RO")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNotification.mutate(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
