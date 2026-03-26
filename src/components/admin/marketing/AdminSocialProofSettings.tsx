import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Eye } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  enabled: true,
  show_frequency_seconds: 15,
  display_duration_seconds: 5,
  max_age_hours: 24,
  position: "bottom-left",
  show_product_image: true,
  show_city: true,
  show_time_ago: true,
  min_orders_to_show: 1,
};

export default function AdminSocialProofSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "social_proof_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "social_proof_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări Social Proof salvate!");
    setSaving(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Eye className="w-5 h-5" /> Social Proof Popup</h1>
          <p className="text-sm text-muted-foreground">Configurare notificări „X din Y a cumpărat recent..."</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Setări generale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>Activare Social Proof</Label><Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Frecvență afișare (secunde)</Label><Input type="number" value={settings.show_frequency_seconds} onChange={e => set("show_frequency_seconds", +e.target.value)} /></div>
            <div><Label>Durată afișare (secunde)</Label><Input type="number" value={settings.display_duration_seconds} onChange={e => set("display_duration_seconds", +e.target.value)} /></div>
            <div><Label>Vechime max. comenzi (ore)</Label><Input type="number" value={settings.max_age_hours} onChange={e => set("max_age_hours", +e.target.value)} /></div>
            <div><Label>Nr. minim comenzi pentru afișare</Label><Input type="number" value={settings.min_orders_to_show} onChange={e => set("min_orders_to_show", +e.target.value)} /></div>
          </div>
          <div>
            <Label>Poziție popup</Label>
            <Select value={settings.position} onValueChange={v => set("position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-left">Stânga jos</SelectItem>
                <SelectItem value="bottom-right">Dreapta jos</SelectItem>
                <SelectItem value="top-left">Stânga sus</SelectItem>
                <SelectItem value="top-right">Dreapta sus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between"><Label>Afișare imagine produs</Label><Switch checked={settings.show_product_image} onCheckedChange={v => set("show_product_image", v)} /></div>
          <div className="flex items-center justify-between"><Label>Afișare oraș</Label><Switch checked={settings.show_city} onCheckedChange={v => set("show_city", v)} /></div>
          <div className="flex items-center justify-between"><Label>Afișare „acum X minute"</Label><Switch checked={settings.show_time_ago} onCheckedChange={v => set("show_time_ago", v)} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
