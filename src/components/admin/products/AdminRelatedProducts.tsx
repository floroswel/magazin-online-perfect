import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminRelatedProducts() {
  const [relationType, setRelationType] = useState("similar");
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-relations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, category_id, brand_id, brands(name), price, images").order("name").limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Link2 className="w-5 h-5" /> Produse Similare & Asociate</h1>
          <p className="text-sm text-muted-foreground">Configurare manuală/automată produse similare, cross-sell, upsell.</p>
        </div>
        <div className="flex gap-2">
          <Select value={relationType} onValueChange={setRelationType}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="similar">Produse similare</SelectItem>
              <SelectItem value="cross_sell">Cross-sell</SelectItem>
              <SelectItem value="upsell">Upsell</SelectItem>
              <SelectItem value="accessory">Accesorii</SelectItem>
              <SelectItem value="frequently_bought">Cumpărate împreună</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => toast({ title: "Auto-generare lansată", description: "Se analizează produsele după categorie și brand." })}>
            <Wand2 className="w-4 h-4 mr-1" /> Auto-generare
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Relații ({relationType})</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nu sunt produse.</TableCell></TableRow>
              ) : products.slice(0, 15).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{p.brands?.name || "—"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">0 relații</TableCell>
                  <TableCell><Button variant="ghost" size="sm">Configurează</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
