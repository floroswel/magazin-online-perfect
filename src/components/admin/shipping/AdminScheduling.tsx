import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, CalendarDays } from "lucide-react";
import { useState } from "react";

const timeSlots = [
  { id: "morning", label: "Dimineața (09:00 - 12:00)", active: true },
  { id: "afternoon", label: "După-amiaza (12:00 - 17:00)", active: true },
  { id: "evening", label: "Seara (17:00 - 21:00)", active: false },
  { id: "saturday", label: "Sâmbăta (09:00 - 14:00)", active: false },
];

export default function AdminScheduling() {
  const [slots, setSlots] = useState(timeSlots);
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Programări Livrare</h1>
        <p className="text-sm text-muted-foreground">Permite clienților să aleagă interval orar preferată pentru livrare.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Label className="font-semibold">Activează programări livrare</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{s.label}</span>
                </div>
                <Switch checked={s.active} onCheckedChange={(checked) => setSlots(slots.map(i => i.id === s.id ? { ...i, active: checked } : i))} disabled={!enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
