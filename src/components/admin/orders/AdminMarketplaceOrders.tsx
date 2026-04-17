import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Search, Filter, ExternalLink } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminMarketplaceOrders() {
  const [search, setSearch] = useState("");
  const [marketplace, setMarketplace] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["marketplace-orders", marketplace],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (marketplace !== "all") q = q.eq("payment_method", marketplace);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders.filter((o: any) =>
    !search || o.id?.includes(search) || o.shipping_address?.toString().toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Globe className="w-5 h-5" /> Comenzi Marketplace</h1>
        <p className="text-sm text-muted-foreground">Comenzi importate din eMAG, Allegro și alte marketplace-uri.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută comandă..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={marketplace} onValueChange={setMarketplace}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="emag">eMAG</SelectItem>
            <SelectItem value="allegro">Allegro</SelectItem>
            <SelectItem value="olx">OLX</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Comandă</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu există comenzi marketplace momentan.</TableCell></TableRow>
              ) : filtered.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="outline">eMAG</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                  <TableCell className="font-semibold">{o.total} RON</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{format(new Date(o.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
