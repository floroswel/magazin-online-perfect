import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers } from "lucide-react";

export default function AdminAttributeSets() {
  const { data: attributes = [] } = useQuery({
    queryKey: ["product-attributes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_attributes").select("*, attribute_values(*)").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-sets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Layers className="w-5 h-5" /> Seturi de Atribute</h1>
          <p className="text-sm text-muted-foreground">Grupuri de atribute asociate pe categorii de produse.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Set nou</Button>
      </div>
      <div className="grid gap-3">
        {categories.slice(0, 8).map((cat: any) => (
          <Card key={cat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div>
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{attributes.length} atribute disponibile</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {attributes.slice(0, 3).map((a: any) => (
                  <Badge key={a.id} variant="outline" className="text-[10px]">{a.name}</Badge>
                ))}
                {attributes.length > 3 && <Badge variant="secondary" className="text-[10px]">+{attributes.length - 3}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Adaugă categorii pentru a configura seturi de atribute.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
