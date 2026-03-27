import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Building2, Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminB2BOrders() {
  const [search, setSearch] = useState("");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["b2b-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      // Filter B2B orders — those with billing_address containing CUI/company info
      return (data || []).filter((o: any) => {
        const billing = o.billing_address as any;
        return billing?.cui || billing?.company_name || billing?.reg_com;
      });
    },
  });

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const billing = o.billing_address as any;
    return o.id?.toLowerCase().includes(s) || billing?.company_name?.toLowerCase().includes(s) || billing?.cui?.toLowerCase().includes(s) || (o.shipping_address as any)?.full_name?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Building2 className="w-5 h-5" /> Comenzi B2B</h1>
        <p className="text-sm text-muted-foreground">Comenzi de la persoane juridice, cu facturare separată.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută comandă B2B..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Firmă / CUI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt comenzi B2B.</TableCell></TableRow>
              ) : filtered.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{(() => { const b = o.billing_address as any; return b?.company_name ? `${b.company_name}${b.cui ? ` (${b.cui})` : ""}` : "—"; })()}</TableCell>
                  <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                  <TableCell className="font-semibold">{o.total} RON</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd.MM.yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
