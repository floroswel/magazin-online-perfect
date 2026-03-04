import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGdprSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    cookie_consent_enabled: true,
    cookie_consent_text: "Folosim cookie-uri pentru a îmbunătăți experiența pe site. Prin continuarea navigării, acceptați politica noastră de confidențialitate.",
    data_retention_days: 365,
    auto_delete_inactive: false,
    inactive_threshold_days: 730,
    allow_data_export: true,
    allow_account_deletion: true,
    dpo_email: "",
    privacy_policy_url: "/page/gdpr",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "gdpr_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings((s) => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "gdpr_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări GDPR salvate" });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">GDPR & Politici</h1>
          <p className="text-sm text-muted-foreground">Consimțământ cookie-uri, retenție date, export/ștergere.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Cookie Consent</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><Label>Banner cookie activ</Label><Switch checked={settings.cookie_consent_enabled} onCheckedChange={(v) => setSettings((s) => ({ ...s, cookie_consent_enabled: v }))} /></div>
          <div><Label>Text consimțământ</Label><Textarea value={settings.cookie_consent_text} onChange={(e) => setSettings((s) => ({ ...s, cookie_consent_text: e.target.value }))} rows={2} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Retenție date</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Perioadă retenție (zile)</Label><Input type="number" value={settings.data_retention_days} onChange={(e) => setSettings((s) => ({ ...s, data_retention_days: +e.target.value }))} /></div>
            <div><Label>Email DPO</Label><Input value={settings.dpo_email} onChange={(e) => setSettings((s) => ({ ...s, dpo_email: e.target.value }))} placeholder="dpo@magazin.ro" /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Ștergere automată conturi inactive</Label><Switch checked={settings.auto_delete_inactive} onCheckedChange={(v) => setSettings((s) => ({ ...s, auto_delete_inactive: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Permite export date (GDPR Art. 20)</Label><Switch checked={settings.allow_data_export} onCheckedChange={(v) => setSettings((s) => ({ ...s, allow_data_export: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Permite ștergere cont (GDPR Art. 17)</Label><Switch checked={settings.allow_account_deletion} onCheckedChange={(v) => setSettings((s) => ({ ...s, allow_account_deletion: v }))} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
