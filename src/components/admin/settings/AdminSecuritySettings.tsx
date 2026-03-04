import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSecuritySettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    min_password_length: 8,
    require_uppercase: true,
    require_numbers: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    enable_recaptcha: false,
    recaptcha_site_key: "",
    session_timeout_hours: 24,
    force_https: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "security_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings((s) => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "security_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări securitate salvate" });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Securitate</h1>
          <p className="text-sm text-muted-foreground">Parolă minimă, blocare, reCAPTCHA.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Politici parole</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Lungime minimă parolă</Label><Input type="number" value={settings.min_password_length} onChange={(e) => setSettings((s) => ({ ...s, min_password_length: +e.target.value }))} /></div>
            <div><Label>Încercări max. login</Label><Input type="number" value={settings.max_login_attempts} onChange={(e) => setSettings((s) => ({ ...s, max_login_attempts: +e.target.value }))} /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Literă mare obligatorie</Label><Switch checked={settings.require_uppercase} onCheckedChange={(v) => setSettings((s) => ({ ...s, require_uppercase: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Cifre obligatorii</Label><Switch checked={settings.require_numbers} onCheckedChange={(v) => setSettings((s) => ({ ...s, require_numbers: v }))} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Blocare cont (minute)</Label><Input type="number" value={settings.lockout_duration_minutes} onChange={(e) => setSettings((s) => ({ ...s, lockout_duration_minutes: +e.target.value }))} /></div>
            <div><Label>Timeout sesiune (ore)</Label><Input type="number" value={settings.session_timeout_hours} onChange={(e) => setSettings((s) => ({ ...s, session_timeout_hours: +e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">reCAPTCHA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><Label>Activare reCAPTCHA</Label><Switch checked={settings.enable_recaptcha} onCheckedChange={(v) => setSettings((s) => ({ ...s, enable_recaptcha: v }))} /></div>
          {settings.enable_recaptcha && <div><Label>Site Key</Label><Input value={settings.recaptcha_site_key} onChange={(e) => setSettings((s) => ({ ...s, recaptcha_site_key: e.target.value }))} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
