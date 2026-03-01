import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import MokkaConnectionSettings from "./mokka/MokkaConnectionSettings";
import MokkaDisplaySettings from "./mokka/MokkaDisplaySettings";
import MokkaConditionsSettings from "./mokka/MokkaConditionsSettings";
import MokkaCallbackSettings from "./mokka/MokkaCallbackSettings";
import MokkaLogs from "./mokka/MokkaLogs";

export default function AdminMokkaSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["mokka-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mokka_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Validate
      const accepted = formData.accepted_terms || [];
      if (accepted.length === 0) {
        throw new Error("Selectează cel puțin o rată acceptată.");
      }
      if (formData.order_value_type === "range") {
        if ((formData.min_order_value ?? 0) >= (formData.max_order_value ?? 0)) {
          throw new Error("Valoarea minimă trebuie să fie mai mică decât valoarea maximă.");
        }
      }
      if (formData.ip_whitelist_enabled && formData.ip_whitelist?.length > 0) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const invalid = formData.ip_whitelist.find((ip: string) => !ipRegex.test(ip));
        if (invalid) throw new Error(`IP invalid: ${invalid}`);
      }

      const { id, ...rest } = formData;
      const { error } = await supabase
        .from("mokka_settings")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mokka-settings"] });
      toast({ title: "Setări salvate cu succes" });
    },
    onError: (err: any) => {
      toast({ title: "Eroare la salvare", description: err.message, variant: "destructive" });
    },
  });

  const handleChange = (patch: any) => {
    setForm((prev: any) => ({ ...prev, ...patch }));
  };

  if (isLoading || !form) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-mokka font-extrabold">Mokka</span> — Plată în Rate
            </h1>
            <p className="text-sm text-muted-foreground">Configurare completă integrare Mokka (BNPL).</p>
          </div>
          {form.demo_mode && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">DEMO</Badge>
          )}
        </div>
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Salvează setările
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <MokkaConnectionSettings settings={form} onChange={handleChange} />
          <MokkaDisplaySettings settings={form} onChange={handleChange} />
        </div>
        <div className="space-y-4">
          <MokkaConditionsSettings settings={form} onChange={handleChange} />
          <MokkaCallbackSettings />
        </div>
      </div>

      <MokkaLogs />
    </div>
  );
}
