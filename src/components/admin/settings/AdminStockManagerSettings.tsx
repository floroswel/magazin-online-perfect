import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export default function AdminStockManagerSettings() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ["stock-manager-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "stock_manager_enabled")
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
      queryClient.invalidateQueries({ queryKey: ["stock-manager-setting"] });
      queryClient.invalidateQueries({ queryKey: ["stock-manager-enabled"] });
      toast.success("Setări Manager Stocuri salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Setări Manager Stocuri
          </h1>
          <p className="text-sm text-muted-foreground">Comenzi furnizor, recepție marfă, gestiune furnizori</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul Manager Stocuri Activ</Label>
              <p className="text-sm text-muted-foreground">Activează comenzi furnizor, recepție marfă și gestiune furnizori</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-600 border-green-500/30">✅ Modul activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ Modul dezactivat</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Funcționalități incluse</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Gestiune furnizori cu date de contact complete</li>
            <li>Comenzi furnizor cu adăugare manuală sau import CSV/Excel</li>
            <li>Recepție marfă cu validare cantități și actualizare automată stoc</li>
            <li>Recepție parțială cu tracking progres per comandă</li>
            <li>Duplicare comenzi pentru aprovizionare recurentă</li>
            <li>Jurnal recepție cu istoric complet</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
