import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, FormInput } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomizationSettings() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ["customization-fields-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "customization_fields_enabled")
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
      queryClient.invalidateQueries({ queryKey: ["customization-fields-setting"] });
      queryClient.invalidateQueries({ queryKey: ["customization-fields-enabled"] });
      toast.success("Setări personalizare comandă salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FormInput className="w-5 h-5 text-primary" /> Setări Personalizare Comandă
          </h1>
          <p className="text-sm text-muted-foreground">Configurare globală pentru câmpuri de personalizare la nivel de produs</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul Personalizare Comandă Activ</Label>
              <p className="text-sm text-muted-foreground">
                Permite clienților să adauge conținut personalizat (text, imagini, fișiere) la produse
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-600 border-green-500/30">✅ Modul activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ Modul dezactivat — câmpurile sunt ascunse</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Cum funcționează</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Creează câmpuri de personalizare (text, imagine, fișier, dropdown etc.)</li>
            <li>Asociază câmpurile la produse individual sau în masă</li>
            <li>Clienții completează câmpurile pe pagina produsului înainte de Add to Cart</li>
            <li>Datele personalizate sunt atașate la comandă și vizibile în admin</li>
            <li>Fișierele uploadate sunt stocate permanent și descărcabile din detaliul comenzii</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Tipuri de câmpuri disponibile</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: "Text", desc: "Input text simplu" },
              { label: "Long Text", desc: "Textarea multi-line" },
              { label: "HTML", desc: "Rich text editor" },
              { label: "Numeric", desc: "Numere întregi" },
              { label: "Float", desc: "Numere cu zecimale" },
              { label: "Boolean", desc: "Checkbox Da/Nu" },
              { label: "Lista", desc: "Dropdown cu opțiuni" },
              { label: "Fișier", desc: "Upload fișiere" },
              { label: "Imagine", desc: "Upload imagini" },
              { label: "Lista fișiere", desc: "Selectare din fișiere predefinite" },
              { label: "Product Picker", desc: "Add-on la checkout" },
              { label: "Product Multipicker", desc: "Add-on-uri multiple" },
            ].map((t) => (
              <div key={t.label} className="p-2 rounded border border-border">
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
