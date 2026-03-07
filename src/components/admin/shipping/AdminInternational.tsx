import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Plus, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const defaultCarriers = [
  { id: "dhl", name: "DHL Express", countries: "Global", active: false },
  { id: "ups", name: "UPS", countries: "Global", active: false },
  { id: "fedex", name: "FedEx", countries: "Global", active: false },
  { id: "dpd-intl", name: "DPD International", countries: "EU", active: false },
  { id: "gls-eu", name: "GLS Europe", countries: "EU", active: false },
];

export default function AdminInternational() {
  const queryClient = useQueryClient();

  const { data: carriers } = useQuery({
    queryKey: ["intl-carriers-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "international_carriers")
        .maybeSingle();
      return (data?.value_json as any)?.carriers || defaultCarriers;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: any[]) => {
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "international_carriers").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value_json: { carriers: updated } as any }).eq("key", "international_carriers");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key: "international_carriers", value_json: { carriers: updated } as any });
        if (error) throw error;
      }
      toast({ title: "Salvat!" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intl-carriers-settings"] }),
  });

  const currentCarriers = carriers || defaultCarriers;

  const toggleCarrier = (id: string, checked: boolean) => {
    const updated = currentCarriers.map((c: any) => c.id === id ? { ...c, active: checked } : c);
    saveMutation.mutate(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Globe className="w-5 h-5" /> Livrări Internaționale</h1>
          <p className="text-sm text-muted-foreground">Curieri și tarife pentru livrări internaționale. Setările se salvează automat.</p>
        </div>
      </div>
      <div className="grid gap-3">
        {currentCarriers.map((c: any) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Acoperire: {c.countries}</p>
              </div>
              <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">{c.active ? "Activ" : "Inactiv"}</Badge>
              <Switch checked={c.active} onCheckedChange={(checked) => toggleCarrier(c.id, checked)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
