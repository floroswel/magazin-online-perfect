import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Save, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminBundleSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["bundle-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundle_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [form, setForm] = useState({
    enabled: false,
    default_availability_rule: "all_available",
    default_order_display_mode: "bundle_zero",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        default_availability_rule: settings.default_availability_rule,
        default_order_display_mode: settings.default_order_display_mode,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("No settings row");
      const { error } = await supabase
        .from("bundle_settings" as any)
        .update({ ...form, updated_at: new Date().toISOString() } as any)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundle-settings"] });
      toast.success("Setări pachete salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Setări Pachete de Produse
          </h1>
          <p className="text-sm text-muted-foreground">Configurare globală pentru modulul de pachete (bundles)</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      {/* Global Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul Pachete Activ</Label>
              <p className="text-sm text-muted-foreground">Activează/dezactivează funcționalitatea de pachete de produse</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
          </div>
          {form.enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-500 border-green-500/30">✅ Modul pachete activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ Modul pachete dezactivat</Badge>
          )}
        </CardContent>
      </Card>

      {/* Default Availability Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Regulă implicită de disponibilitate</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={form.default_availability_rule}
            onValueChange={(v) => setForm((f) => ({ ...f, default_availability_rule: v }))}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="regardless" id="avail-regardless" className="mt-1" />
              <div>
                <Label htmlFor="avail-regardless" className="font-medium cursor-pointer">
                  Indiferent care este disponibilitatea produselor componente
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Pachetul poate fi achiziționat chiar dacă un produs component este indisponibil (legat de setarea globală de backorder)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="all_available" id="avail-all" className="mt-1" />
              <div>
                <Label htmlFor="avail-all" className="font-medium cursor-pointer">
                  Doar dacă toate produsele componente sunt disponibile
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Dacă orice componentă este indisponibilă, pachetul nu poate fi comandat
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Default Order Display Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mod afișare implicit în comenzi</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={form.default_order_display_mode}
            onValueChange={(v) => setForm((f) => ({ ...f, default_order_display_mode: v }))}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="bundle_zero" id="display-bundle" className="mt-1" />
              <div>
                <Label htmlFor="display-bundle" className="font-medium cursor-pointer">
                  Pachetul cu prețul setat și produsele componente cu preț zero
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  În comanda: pachetul apare ca linie cu prețul complet, componentele apar cu 0 RON
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="components_adjusted" id="display-components" className="mt-1" />
              <div>
                <Label htmlFor="display-components" className="font-medium cursor-pointer">
                  Doar produsele componente cu preț individual ajustat proporțional
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Pachetul nu apare ca linie separată, doar componentele cu prețuri distribuite proporțional
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
