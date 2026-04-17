import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus, GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminMenus() {
  const queryClient = useQueryClient();

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

  const { data: menuSettings } = useQuery({
    queryKey: ["menu-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "menu_config").maybeSingle();
      return (data?.value_json as any) || { headerOrder: [], footerOrder: [] };
    },
  });

  const [headerItems, setHeaderItems] = useState<any[]>([]);
  const [footerItems, setFooterItems] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const topCats = categories.filter((c: any) => !c.parent_id).slice(0, 10);
    const savedHeader = menuSettings?.headerOrder || [];
    if (savedHeader.length > 0) {
      // Reorder based on saved order
      const ordered = savedHeader
        .map((id: string) => topCats.find((c: any) => c.id === id))
        .filter(Boolean);
      const remaining = topCats.filter((c: any) => !savedHeader.includes(c.id));
      setHeaderItems([...ordered, ...remaining]);
    } else {
      setHeaderItems(topCats);
    }
  }, [categories, menuSettings]);

  useEffect(() => {
    const savedFooter = menuSettings?.footerOrder || [];
    const allPages = pages.slice(0, 8);
    if (savedFooter.length > 0) {
      const ordered = savedFooter.map((id: string) => allPages.find((p: any) => p.id === id)).filter(Boolean);
      const remaining = allPages.filter((p: any) => !savedFooter.includes(p.id));
      setFooterItems([...ordered, ...remaining]);
    } else {
      setFooterItems(allPages);
    }
  }, [pages, menuSettings]);

  const move = (list: any[], setList: (v: any[]) => void, idx: number, dir: number) => {
    const newList = [...list];
    const [item] = newList.splice(idx, 1);
    newList.splice(idx + dir, 0, item);
    setList(newList);
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config = {
        headerOrder: headerItems.map((i: any) => i.id),
        footerOrder: footerItems.map((i: any) => i.id),
      };
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "menu_config").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value_json: config as any }).eq("key", "menu_config");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key: "menu_config", value_json: config as any });
        if (error) throw error;
      }
      setDirty(false);
      toast({ title: "Meniu salvat!" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-settings"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Menu className="w-5 h-5" /> Meniu & Navigație</h1>
          <p className="text-sm text-muted-foreground">Configurare meniuri de navigație header și footer.</p>
        </div>
        {dirty && (
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvează ordinea
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Meniu Principal (Header)</h3>
            <div className="space-y-2">
              {headerItems.map((c: any, idx: number) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{c.name}</span>
                  <Badge variant="outline" className="text-[10px]">Categorie</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => move(headerItems, setHeaderItems, idx, -1)}>
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === headerItems.length - 1} onClick={() => move(headerItems, setHeaderItems, idx, 1)}>
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {headerItems.length === 0 && <p className="text-xs text-muted-foreground">Adaugă categorii pentru meniu.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Meniu Footer</h3>
            <div className="space-y-2">
              {footerItems.map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{p.title}</span>
                  <Badge variant="outline" className="text-[10px]">Pagină</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => move(footerItems, setFooterItems, idx, -1)}>
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === footerItems.length - 1} onClick={() => move(footerItems, setFooterItems, idx, 1)}>
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {footerItems.length === 0 && <p className="text-xs text-muted-foreground">Adaugă pagini CMS publicate.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
