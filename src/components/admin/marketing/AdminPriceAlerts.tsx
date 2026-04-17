import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Bell, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminPriceAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["admin-price-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("price_alerts").select("*, products(name, price, old_price, image_url)").order("created_at", { ascending: false }).limit(300);
      return (data as any[]) || [];
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => { await supabase.from("price_alerts").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-price-alerts"] }); toast.success("Alertă ștearsă"); },
  });

  const markSent = async (id: string) => {
    await supabase.from("price_alerts").update({ notified: true, notified_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-price-alerts"] });
    toast.success("Marcat ca trimis");
  };

  const pending = alerts.filter((a: any) => !a.notified);
  const triggered = alerts.filter((a: any) => {
    const product = a.products;
    return product && product.price <= a.target_price && !a.notified;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><TrendingDown className="w-5 h-5" /> Alerte de Preț</h1>
        <p className="text-sm text-muted-foreground">Clienții primesc email automat când prețul scade sub pragul setat.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bell className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{alerts.length}</p><p className="text-xs text-muted-foreground">Total alerte</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingDown className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{triggered.length}</p><p className="text-xs text-muted-foreground">Declanșate (preț atins)</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="w-8 h-8 text-amber-500" /><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">Netrimise</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate alertele de preț</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Produs</TableHead><TableHead>Preț curent</TableHead><TableHead>Prag alertă</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : alerts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio alertă de preț.</TableCell></TableRow>
              ) : alerts.map((a: any) => {
                const isTriggered = a.products && a.products.price <= a.target_price;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{a.email}</TableCell>
                    <TableCell className="text-sm font-medium">{a.products?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{a.products?.price || "—"} RON</TableCell>
                    <TableCell className="text-sm font-mono">{a.target_price} RON</TableCell>
                    <TableCell>
                      {a.notified ? <Badge>Trimis</Badge> : isTriggered ? <Badge variant="destructive">Declanșat!</Badge> : <Badge variant="secondary">Activ</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell className="flex gap-1">
                      {!a.notified && isTriggered && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markSent(a.id)}><Mail className="h-3.5 w-3.5" /></Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAlert.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
