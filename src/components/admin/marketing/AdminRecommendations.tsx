import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useState } from "react";

const algorithms = [
  { id: "1", name: "Produse similare", desc: "Bazat pe categorie, brand și preț similar", placement: "Pagina produs", active: true },
  { id: "2", name: "Cumpărate frecvent împreună", desc: "Produse din aceeași comandă", placement: "Pagina produs + Coș", active: true },
  { id: "3", name: "Bazat pe istoric", desc: "Produse similare cu cele vizualizate recent", placement: "Homepage", active: false },
  { id: "4", name: "Trending", desc: "Cele mai vândute în ultimele 7 zile", placement: "Homepage + Catalog", active: true },
  { id: "5", name: "Personalizat AI", desc: "Recomandări ML bazate pe comportamentul userului", placement: "Email + Homepage", active: false },
];

export default function AdminRecommendations() {
  const [items, setItems] = useState(algorithms);
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
              <Switch checked={a.active} onCheckedChange={(checked) => setItems(items.map(i => i.id === a.id ? { ...i, active: checked } : i))} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
