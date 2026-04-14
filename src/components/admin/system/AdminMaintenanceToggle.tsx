import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Construction, Save, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminMaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("Site-ul este în mentenanță. Revenim în curând!");
  const [allowedIps, setAllowedIps] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("value_json")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      if (data?.value_json) {
        const v = data.value_json as any;
        setEnabled(v.enabled ?? false);
        setMessage(v.message ?? "Site-ul este în mentenanță. Revenim în curând!");
        setAllowedIps(v.allowed_ips ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = { enabled, message, allowed_ips: allowedIps };
    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert(
        { key: "maintenance_mode", value_json: payload, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      toast.error("Eroare la salvare");
    } else {
      toast.success(enabled ? "Mod mentenanță ACTIVAT" : "Mod mentenanță DEZACTIVAT");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Construction className="w-6 h-6 text-primary" /> Mod Mentenanță
        </h1>
        <p className="text-sm text-muted-foreground">Pune site-ul offline temporar pentru actualizări sau lucrări tehnice.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Status
            <Badge variant={enabled ? "destructive" : "secondary"} className="text-xs">
              {enabled ? "ACTIV — Site-ul este offline" : "Inactiv — Site-ul este online"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Activare mod mentenanță</p>
              <p className="text-xs text-muted-foreground">Vizitatorii vor vedea pagina de mentenanță. Adminii au acces normal.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label>Mesaj afișat vizitatorilor</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesaj de mentenanță..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> IP-uri permise (opțional)
            </Label>
            <Input
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="Ex: 188.25.x.x, 86.124.x.x (separate cu virgulă)"
            />
            <p className="text-xs text-muted-foreground">Aceste IP-uri vor avea acces la site chiar și în modul mentenanță.</p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Se salvează..." : "Salvează"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
