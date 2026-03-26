import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Save, Loader2, RotateCw, Info } from "lucide-react";

export default function Admin360SliderSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["slider-360-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slider_360_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (vals: any) => {
      const { id, ...rest } = vals;
      const { error } = await supabase
        .from("slider_360_settings" as any)
        .update({ ...rest, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slider-360-settings"] });
      toast.success("Setări 360° Slider salvate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <RotateCw className="h-6 w-6 text-primary" /> 360° Slider
          </h1>
          <p className="text-muted-foreground">Vizualizare interactivă a produselor la 360°</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Activat</Label>
          <Switch checked={form.enabled || false} onCheckedChange={(v) => update("enabled", v)} />
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Încarcă 24-36 cadre per produs fotografiate din unghiuri succesive pentru o rotație fluidă.
          Administrarea cadrelor se face din pagina produsului (Catalog → Produse → editare → secțiunea 360 Slider).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Setări Globale</CardTitle>
          <CardDescription>Valori implicite aplicate tuturor produselor cu 360° slider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-rotație la încărcarea paginii</Label>
              <p className="text-xs text-muted-foreground">Produsul se rotește automat când clientul deschide pagina</p>
            </div>
            <Switch checked={form.auto_rotate_default || false} onCheckedChange={(v) => update("auto_rotate_default", v)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Viteză auto-rotație</Label>
              <span className="text-sm font-medium text-primary">{form.rotation_speed_default || 5}</span>
            </div>
            <Slider
              value={[form.rotation_speed_default || 5]}
              onValueChange={([v]) => update("rotation_speed_default", v)}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lent</span>
              <span>Rapid</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Număr cadre implicit (recomandat)</Label>
            <Input
              type="number"
              min={2}
              max={360}
              value={form.default_frame_count || 36}
              onChange={(e) => update("default_frame_count", parseInt(e.target.value) || 36)}
            />
            <p className="text-xs text-muted-foreground">Numărul de imagini recomandat pentru o rotație fluidă (24-72)</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Afișează indicator "360°" pe imaginea principală</Label>
              <p className="text-xs text-muted-foreground">Badge "360°" vizibil pe thumbnail-ul produsului în listing</p>
            </div>
            <Switch checked={form.show_360_badge ?? true} onCheckedChange={(v) => update("show_360_badge", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Afișează butoane de control</Label>
              <p className="text-xs text-muted-foreground">Play/pause, rotire stânga/dreapta, fullscreen</p>
            </div>
            <Switch checked={form.show_controls ?? true} onCheckedChange={(v) => update("show_controls", v)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => updateSettings.mutate(form)} disabled={updateSettings.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Se salvează..." : "Salvează setările"}
        </Button>
      </div>
    </div>
  );
}
