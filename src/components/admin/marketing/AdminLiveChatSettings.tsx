import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  enabled: true,
  position: "bottom-right",
  welcome_message: "Bună! Cu ce te putem ajuta astăzi? 😊",
  ai_enabled: true,
  ai_model: "gemini-2.5-flash",
  ai_system_prompt: "Ești un asistent de vânzări prieten și util pentru un magazin online din România. Răspunzi scurt și clar, în română.",
  business_hours_only: false,
  business_hours_start: "09:00",
  business_hours_end: "18:00",
  offline_message: "Momentan suntem offline. Lasă-ne un mesaj și te contactăm!",
  primary_color: "",
  collect_email: true,
};

export default function AdminLiveChatSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "livechat_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "livechat_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări Live Chat salvate!");
    setSaving(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Live Chat & Chatbot AI</h1>
          <p className="text-sm text-muted-foreground">Configurare widget de chat cu suport AI integrat.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Activare Live Chat</Label><Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} /></div>
            <div><Label>Mesaj de bun venit</Label><Textarea value={settings.welcome_message} onChange={e => set("welcome_message", e.target.value)} rows={2} /></div>
            <div>
              <Label>Poziție widget</Label>
              <Select value={settings.position} onValueChange={v => set("position", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Dreapta jos</SelectItem>
                  <SelectItem value="bottom-left">Stânga jos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>Colectare email vizitator</Label><Switch checked={settings.collect_email} onCheckedChange={v => set("collect_email", v)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI Chatbot</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Activare AI Chatbot</Label><Switch checked={settings.ai_enabled} onCheckedChange={v => set("ai_enabled", v)} /></div>
            {settings.ai_enabled && (
              <>
                <div><Label>System prompt AI</Label><Textarea value={settings.ai_system_prompt} onChange={e => set("ai_system_prompt", e.target.value)} rows={3} /></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Program de lucru</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Doar în program</Label><Switch checked={settings.business_hours_only} onCheckedChange={v => set("business_hours_only", v)} /></div>
            {settings.business_hours_only && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Deschide la</Label><Input type="time" value={settings.business_hours_start} onChange={e => set("business_hours_start", e.target.value)} /></div>
                <div><Label>Închide la</Label><Input type="time" value={settings.business_hours_end} onChange={e => set("business_hours_end", e.target.value)} /></div>
              </div>
            )}
            <div><Label>Mesaj offline</Label><Textarea value={settings.offline_message} onChange={e => set("offline_message", e.target.value)} rows={2} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
