import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, ListOrdered } from "lucide-react";
import { toast } from "sonner";

export default function AdminPriceListSettings() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ["price-lists-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "price_lists_enabled")
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (setting) setEnabled(setting.value_json === true);
  }, [setting]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!setting?.id) throw new Error("No setting row");
      const { error } = await supabase
        .from("app_settings")
        .update({ value_json: enabled, updated_at: new Date().toISOString() })
        .eq("id", setting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists-setting"] });
      queryClient.invalidateQueries({ queryKey: ["price-lists-enabled"] });
      toast.success("Setări liste de prețuri salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" /> Setări Liste de Prețuri
          </h1>
          <p className="text-sm text-muted-foreground">Configurare globală pentru modulul de liste de prețuri preferențiale</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul Liste de Prețuri Activ</Label>
              <p className="text-sm text-muted-foreground">
                Activează/dezactivează funcționalitatea de liste de prețuri preferențiale per grupuri de clienți
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-500 border-green-500/30">✅ Modul activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ Modul dezactivat — prețurile standard se aplică tuturor</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Cum funcționează</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Creează liste de prețuri cu prețuri preferențiale per produs</li>
            <li>Asociază fiecare listă la unul sau mai multe grupuri de clienți</li>
            <li>Clienții autentificați din grupurile asociate văd prețul preferențial</li>
            <li>Dacă mai multe liste se aplică, se afișează cel mai mic preț</li>
            <li>Vizitatorii neautentificați văd întotdeauna prețul standard</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
