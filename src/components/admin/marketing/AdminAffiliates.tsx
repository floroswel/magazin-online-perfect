import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Loader2, RefreshCw, DollarSign, MousePointerClick, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  total_earnings: number;
  total_paid: number;
  total_clicks: number;
  total_orders: number;
  created_at: string;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false });
    setAffiliates(data || []);
    setLoading(false);
  };

  const approve = async (id: string) => {
    await supabase.from("affiliates").update({ status: "active" }).eq("id", id);
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: "active" } : a));
    toast.success("Afiliat aprobat");
  };

  const totalEarnings = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
  const totalClicks = affiliates.reduce((s, a) => s + (a.total_clicks || 0), 0);
  const totalOrders = affiliates.reduce((s, a) => s + (a.total_orders || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Program Afiliere</h1>
          <p className="text-sm text-muted-foreground">Gestionează afiliații și comisioanele din programul de afiliere</p>
        </div>
        <Button variant="outline" onClick={fetch}><RefreshCw className="w-4 h-4 mr-2" /> Reîncarcă</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total afiliați</p><p className="text-2xl font-bold">{affiliates.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /><div><p className="text-sm text-muted-foreground">Câștiguri totale</p><p className="text-2xl font-bold">{totalEarnings.toFixed(2)} RON</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><MousePointerClick className="w-5 h-5 text-blue-500" /><div><p className="text-sm text-muted-foreground">Clickuri</p><p className="text-2xl font-bold">{totalClicks}</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /><div><p className="text-sm text-muted-foreground">Comenzi afiliate</p><p className="text-2xl font-bold">{totalOrders}</p></div></CardContent></Card>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
          ) : affiliates.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Niciun afiliat înregistrat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cod afiliat</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Clickuri</TableHead>
                  <TableHead>Comenzi</TableHead>
                  <TableHead>Câștiguri</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.affiliate_code}</TableCell>
                    <TableCell>{a.commission_rate}%</TableCell>
                    <TableCell>{a.total_clicks}</TableCell>
                    <TableCell>{a.total_orders}</TableCell>
                    <TableCell className="font-mono">{(a.total_earnings || 0).toFixed(2)} RON</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "active" ? "default" : a.status === "pending" ? "secondary" : "outline"}>
                        {a.status === "active" ? "Activ" : a.status === "pending" ? "În așteptare" : a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.status === "pending" && (
                        <Button size="sm" onClick={() => approve(a.id)}>Aprobă</Button>
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
