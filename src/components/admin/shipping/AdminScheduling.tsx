import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const defaultSlots = [
  { id: "morning", label: "Dimineața (09:00 - 12:00)", active: true },
  { id: "afternoon", label: "După-amiaza (12:00 - 17:00)", active: true },
  { id: "evening", label: "Seara (17:00 - 21:00)", active: false },
  { id: "saturday", label: "Sâmbăta (09:00 - 14:00)", active: false },
];

export default function AdminScheduling() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["delivery-scheduling-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "delivery_scheduling")
        .maybeSingle();
      return (data?.value_json as any) || { enabled: false, slots: defaultSlots };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "delivery_scheduling").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value_json: updated as any }).eq("key", "delivery_scheduling");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key: "delivery_scheduling", value_json: updated as any });
        if (error) throw error;
      }
      toast({ title: "Salvat!" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-scheduling-settings"] }),
  });

  const enabled = settings?.enabled ?? false;
  const slots = settings?.slots || defaultSlots;

  const toggleEnabled = (checked: boolean) => saveMutation.mutate({ ...settings, enabled: checked, slots });
  const toggleSlot = (id: string, checked: boolean) => {
    const updated = slots.map((s: any) => s.id === id ? { ...s, active: checked } : s);
    saveMutation.mutate({ ...settings, slots: updated });
  };

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
            <Switch checked={enabled} onCheckedChange={toggleEnabled} />
          </div>
          <div className="space-y-3">
            {slots.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{s.label}</span>
                </div>
                <Switch checked={s.active} onCheckedChange={(checked) => toggleSlot(s.id, checked)} disabled={!enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
