import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";

const DEFAULTS = {
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
  smtp_pass: "",
  smtp_secure: true,
  from_email: "",
  from_name: "",
  reply_to: "",
  use_resend: true,
};

export default function AdminEmailSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "email_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) setSettings({ ...DEFAULTS, ...(data.value_json as typeof DEFAULTS) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "email_settings", value_json: settings as any, description: "Email/SMTP configuration" }, { onConflict: "key" });
    if (error) toast.error(error.message); else toast.success("Setări email salvate");
    setSaving(false);
  };

  const sendTest = async () => {
    if (!testEmail) { toast.error("Introdu un email de test"); return; }
    setTesting(true);
    const { error } = await supabase.functions.invoke("send-email", {
      body: { type: "test", to: testEmail, data: { message: "Test email din panoul de administrare" } },
    });
    if (error) toast.error("Eroare: " + error.message); else toast.success("Email de test trimis!");
    setTesting(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Email / SMTP</CardTitle>
        <Button onClick={save} disabled={saving} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div>
            <Label className="font-medium">Folosește Resend (recomandat)</Label>
            <p className="text-xs text-muted-foreground">Serviciul de email integrat. Dezactivează pentru SMTP custom.</p>
          </div>
          <Switch checked={settings.use_resend} onCheckedChange={v => set("use_resend", v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Email expeditor</Label><Input value={settings.from_email} onChange={e => set("from_email", e.target.value)} placeholder="noreply@magazin.ro" /></div>
          <div><Label>Nume expeditor</Label><Input value={settings.from_name} onChange={e => set("from_name", e.target.value)} placeholder="MamaLucica" /></div>
          <div><Label>Reply-To</Label><Input value={settings.reply_to} onChange={e => set("reply_to", e.target.value)} placeholder="contact@magazin.ro" /></div>
        </div>

        {!settings.use_resend && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Configurare SMTP</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Host SMTP</Label><Input value={settings.smtp_host} onChange={e => set("smtp_host", e.target.value)} placeholder="smtp.gmail.com" /></div>
              <div><Label>Port</Label><Input type="number" value={settings.smtp_port} onChange={e => set("smtp_port", Number(e.target.value))} /></div>
              <div><Label>Utilizator</Label><Input value={settings.smtp_user} onChange={e => set("smtp_user", e.target.value)} /></div>
              <div><Label>Parolă</Label><Input type="password" value={settings.smtp_pass} onChange={e => set("smtp_pass", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.smtp_secure} onCheckedChange={v => set("smtp_secure", v)} />
              <Label>SSL/TLS</Label>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">Test Email</h3>
          <div className="flex gap-2">
            <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="email@test.com" className="max-w-xs" />
            <Button onClick={sendTest} disabled={testing} variant="outline" size="sm"><Send className="h-4 w-4 mr-1" /> Trimite Test</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
