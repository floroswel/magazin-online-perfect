import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Truck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminAWB() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("orders").select("*").in("status", ["processing", "confirmed"]).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, []);

  const generateAWB = async (orderId: string) => {
    setGenerating(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-awb", {
        body: { order_ids: [orderId], courier: "sameday" },
      });

      if (error) {
        toast({ title: "Eroare la generarea AWB", description: String(error), variant: "destructive" });
        setGenerating(null);
        return;
      }

      const result = data?.results?.[0];
      if (!result) {
        toast({ title: "Nu s-a primit răspuns de la server", variant: "destructive" });
        setGenerating(null);
        return;
      }

      if (result.success) {
        toast({ title: `AWB generat: ${result.awb}` });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        toast({ title: "Eroare AWB", description: result.error || "Eroare necunoscută", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Eroare de conexiune", description: String(err), variant: "destructive" });
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">AWB Automat</h1>
        <p className="text-sm text-muted-foreground">Generare AWB prin API curier pentru comenzi confirmate.</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nu sunt comenzi care necesită AWB.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Adresă</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell>{(o.shipping_address as any)?.full_name || (o.shipping_address as any)?.fullName || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{(o.shipping_address as any)?.address || "—"}, {(o.shipping_address as any)?.city}</TableCell>
                    <TableCell className="font-semibold">{o.total?.toLocaleString("ro-RO")} lei</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => generateAWB(o.id)} disabled={generating === o.id}>
                        {generating === o.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Printer className="w-3.5 h-3.5 mr-1" />}
                        Generează AWB
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
