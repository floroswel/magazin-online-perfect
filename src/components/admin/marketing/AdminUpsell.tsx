import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Plus, Wand2 } from "lucide-react";
import { useState } from "react";

const strategies = [
  { id: "1", name: "Upgrade produs", desc: "Sugerează versiunea superioară (ex: 128GB → 256GB)", type: "upsell", active: true },
  { id: "2", name: "Accesorii complementare", desc: "Husă, folie, încărcător la telefoane", type: "cross_sell", active: true },
  { id: "3", name: "Cumpărate frecvent împreună", desc: "Algoritm bazat pe istoricul comenzilor", type: "frequently_bought", active: false },
  { id: "4", name: "Garanție extinsă", desc: "Ofertă garanție extinsă la checkout", type: "upsell", active: false },
];

export default function AdminUpsell() {
  const [items, setItems] = useState(strategies);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Upsell / Cross-sell</h1>
          <p className="text-sm text-muted-foreground">Configurare recomandări pentru creșterea valorii coșului.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Strategie nouă</Button>
      </div>
      <div className="grid gap-3">
        {items.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              <Switch checked={s.active} onCheckedChange={(checked) => setItems(items.map(i => i.id === s.id ? { ...i, active: checked } : i))} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
