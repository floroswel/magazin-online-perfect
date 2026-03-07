import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const defaultAlgorithms = [
  { id: "similar", name: "Produse similare", desc: "Bazat pe categorie, brand și preț similar", placement: "Pagina produs", active: true },
  { id: "frequently_bought", name: "Cumpărate frecvent împreună", desc: "Produse din aceeași comandă", placement: "Pagina produs + Coș", active: true },
  { id: "history_based", name: "Bazat pe istoric", desc: "Produse similare cu cele vizualizate recent", placement: "Homepage", active: false },
  { id: "trending", name: "Trending", desc: "Cele mai vândute în ultimele 7 zile", placement: "Homepage + Catalog", active: true },
  { id: "ai_personalized", name: "Personalizat AI", desc: "Recomandări ML bazate pe comportamentul userului", placement: "Email + Homepage", active: false },
];

export default function AdminRecommendations() {
  const [items, setItems] = useState(defaultAlgorithms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("key", "recommendation_engines").maybeSingle();
      if (data?.value_json) {
        const saved = data.value_json as Record<string, boolean>;
        setItems(prev => prev.map(a => ({ ...a, active: saved[a.id] ?? a.active })));
      }
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (id: string, checked: boolean) => {
    const updated = items.map(i => i.id === id ? { ...i, active: checked } : i);
    setItems(updated);
    const value = Object.fromEntries(updated.map(i => [i.id, i.active]));
    const { error } = await supabase.from("app_settings").upsert({
      key: "recommendation_engines",
      value_json: value as any,
      description: "Recommendation engine toggles",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) toast({ title: "Eroare", description: error.message, variant: "destructive" });
    else toast({ title: `${items.find(i => i.id === id)?.name} ${checked ? "activat" : "dezactivat"}` });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Sparkles className="w-5 h-5" /> Recomandări Personalizate</h1>
        <p className="text-sm text-muted-foreground">Algoritmi de recomandare pentru creșterea conversiei.</p>
      </div>
      <div className="grid gap-3">
        {items.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{a.name}</p>
                  <Badge variant="outline" className="text-[10px]">{a.placement}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              <Switch checked={a.active} onCheckedChange={(checked) => handleToggle(a.id, checked)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
