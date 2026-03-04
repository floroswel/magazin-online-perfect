import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Cpu, Smartphone, Monitor, Headphones } from "lucide-react";

const specTemplates = [
  { name: "Laptop", icon: Monitor, specs: ["Procesor", "RAM", "SSD", "Display", "Grafică", "Baterie", "Greutate"] },
  { name: "Telefon", icon: Smartphone, specs: ["Procesor", "RAM", "Stocare", "Display", "Camera", "Baterie", "5G"] },
  { name: "Componente PC", icon: Cpu, specs: ["Chipset", "Socket", "Frecvență", "TDP", "Tehnologie"] },
  { name: "Căști", icon: Headphones, specs: ["Tip", "Driver", "Impedanță", "Răspuns frecvență", "Conexiune"] },
];

export default function AdminSpecs() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Specificații Tehnice</h1>
          <p className="text-sm text-muted-foreground">Șabloane de specificații tehnice pe tipuri de produse.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Șablon nou</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {specTemplates.map((t) => (
          <Card key={t.name} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.specs.length} câmpuri</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {t.specs.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
