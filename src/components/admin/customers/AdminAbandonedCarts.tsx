import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Mail, Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

interface AbandonedCart {
  id: string;
  user_email: string | null;
  items: any[];
  total: number;
  recovery_email_sent: boolean;
  recovered: boolean;
  last_activity_at: string;
  created_at: string;
}

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCarts(); }, []);

  const fetchCarts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .order("last_activity_at", { ascending: false })
      .limit(100);
    if (!error) setCarts(data || []);
    setLoading(false);
  };

  const totalValue = carts.reduce((s, c) => s + (c.total || 0), 0);
  const recoveredCount = carts.filter(c => c.recovered).length;
  const pendingCount = carts.filter(c => !c.recovered && !c.recovery_email_sent).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Coșuri Abandonate
          </h1>
          <p className="text-sm text-muted-foreground">Monitorizează și recuperează coșurile abandonate de clienți</p>
        </div>
        <Button variant="outline" onClick={fetchCarts}><RefreshCw className="w-4 h-4 mr-2" /> Reîncarcă</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total coșuri</p><p className="text-2xl font-bold">{carts.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Valoare totală</p><p className="text-2xl font-bold">{totalValue.toFixed(2)} RON</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Recuperate</p><p className="text-2xl font-bold text-green-500">{recoveredCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Necontactate</p><p className="text-2xl font-bold text-yellow-500">{pendingCount}</p></CardContent></Card>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
          ) : carts.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Niciun coș abandonat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Produse</TableHead>
                  <TableHead>Valoare</TableHead>
                  <TableHead>Ultima activitate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map(cart => (
                  <TableRow key={cart.id}>
                    <TableCell className="font-medium">{cart.user_email || "Anonim"}</TableCell>
                    <TableCell>{Array.isArray(cart.items) ? cart.items.length : 0} produse</TableCell>
                    <TableCell className="font-mono">{(cart.total || 0).toFixed(2)} RON</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(cart.last_activity_at).toLocaleString("ro-RO")}</TableCell>
                    <TableCell>
                      {cart.recovered ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Recuperat</Badge>
                      ) : cart.recovery_email_sent ? (
                        <Badge variant="secondary">Email trimis</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Necontactat</Badge>
                      )}
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
