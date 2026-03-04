import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Plus } from "lucide-react";
import { useState } from "react";

const intlCarriers = [
  { id: "1", name: "DHL Express", countries: "Global", active: false },
  { id: "2", name: "UPS", countries: "Global", active: false },
  { id: "3", name: "FedEx", countries: "Global", active: false },
  { id: "4", name: "DPD International", countries: "EU", active: false },
  { id: "5", name: "GLS Europe", countries: "EU", active: false },
];

export default function AdminInternational() {
  const [carriers, setCarriers] = useState(intlCarriers);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Globe className="w-5 h-5" /> Livrări Internaționale</h1>
          <p className="text-sm text-muted-foreground">Curieri și tarife pentru livrări internaționale.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă curier</Button>
      </div>
      <div className="grid gap-3">
        {carriers.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Acoperire: {c.countries}</p>
              </div>
              <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">{c.active ? "Activ" : "Inactiv"}</Badge>
              <Switch checked={c.active} onCheckedChange={(checked) => setCarriers(carriers.map(i => i.id === c.id ? { ...i, active: checked } : i))} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
