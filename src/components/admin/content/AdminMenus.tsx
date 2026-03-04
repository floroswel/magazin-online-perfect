import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus, GripVertical } from "lucide-react";

export default function AdminMenus() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["pages-for-menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cms_pages").select("id, title, slug").eq("published", true).order("title");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Menu className="w-5 h-5" /> Meniu & Navigație</h1>
          <p className="text-sm text-muted-foreground">Configurare meniuri de navigație header și footer.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Meniu nou</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Meniu Principal (Header)</h3>
            <div className="space-y-2">
              {categories.filter((c: any) => !c.parent_id).slice(0, 8).map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm flex-1">{c.name}</span>
                  <Badge variant="outline" className="text-[10px]">Categorie</Badge>
                </div>
              ))}
              {categories.length === 0 && <p className="text-xs text-muted-foreground">Adaugă categorii pentru meniu.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Meniu Footer</h3>
            <div className="space-y-2">
              {pages.slice(0, 6).map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm flex-1">{p.title}</span>
                  <Badge variant="outline" className="text-[10px]">Pagină</Badge>
                </div>
              ))}
              {pages.length === 0 && <p className="text-xs text-muted-foreground">Adaugă pagini CMS publicate.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
