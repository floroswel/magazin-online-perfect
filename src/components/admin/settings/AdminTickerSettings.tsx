import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown, Plus, RefreshCw } from "lucide-react";

/* ── Helpers ── */
function SettingToggle({ label, settingKey, s, save }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={s[settingKey] === "true"} onCheckedChange={v => save(settingKey, v ? "true" : "false")} />
    </div>
  );
}

function SettingInput({ label, settingKey, s, save, placeholder }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={s[settingKey] || ""} placeholder={placeholder} onChange={e => save(settingKey, e.target.value)} />
    </div>
  );
}

function SettingColor({ label, settingKey, s, save }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="min-w-[140px]">{label}</Label>
      <input type="color" value={s[settingKey] || "#000000"} onChange={e => save(settingKey, e.target.value)} className="w-10 h-8 rounded border cursor-pointer" />
      <Input value={s[settingKey] || ""} onChange={e => save(settingKey, e.target.value)} className="w-28" />
    </div>
  );
}

export default function AdminTickerSettings() {
  const { settings: s, updateSetting } = useSettings();
  const [socialPreview, setSocialPreview] = useState<string[]>([]);
  const [loadingSP, setLoadingSP] = useState(false);

  const save = useCallback((key: string, value: string) => {
    updateSetting(key, value).then(ok => { if (ok) toast.success("Salvat ✓"); });
  }, [updateSetting]);

  // Parse ticker2 messages
  const messages = (s.ticker2_messages || "").split("|").filter(Boolean);
  const setMessages = (msgs: string[]) => save("ticker2_messages", msgs.join("|"));

  const moveMsg = (i: number, dir: -1 | 1) => {
    const arr = [...messages];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setMessages(arr);
  };

  const fetchSocialProof = useCallback(async () => {
    setLoadingSP(true);
    const { data, error } = await supabase.rpc("get_social_proof_messages", { limit_count: 5 });
    if (data) setSocialPreview((data as any[]).map((r: any) => r.message));
    else if (error) toast.error("Eroare: " + error.message);
    setLoadingSP(false);
  }, []);

  useEffect(() => { fetchSocialProof(); }, [fetchSocialProof]);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Ticker Bars & Bannere</h1>
        <p className="text-muted-foreground">Configurează barele animate și alertele site-ului.</p>
      </div>

      {/* ═══ 1. TICKER 1 — bara simplă (topbar) ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Ticker 1 — Bara Simplă (Top)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează Ticker 1" settingKey="ticker1_show" s={s} save={save} />
          <SettingInput label="Text mesaj" settingKey="ticker1_text" s={s} save={save} />
          <SettingColor label="Fundal" settingKey="ticker1_bg_color" s={s} save={save} />
          <SettingColor label="Text" settingKey="ticker1_text_color" s={s} save={save} />
          <div className="space-y-1">
            <Label>Viteză animație ({s.ticker1_speed || "30"}s)</Label>
            <Slider min={10} max={100} step={5} value={[parseInt(s.ticker1_speed || "30")]} onValueChange={([v]) => save("ticker1_speed", String(v))} />
          </div>
          <div className="space-y-1">
            <Label>Direcție</Label>
            <Select value={s.ticker1_direction || "left"} onValueChange={v => save("ticker1_direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Stânga → Dreapta</SelectItem>
                <SelectItem value="right">Dreapta → Stânga</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Preview */}
          {s.ticker1_show === "true" && (
            <div className="rounded border overflow-hidden">
              <div className="h-9 flex items-center overflow-hidden text-xs font-semibold" style={{ backgroundColor: s.ticker1_bg_color || "#FFFFFF", color: s.ticker1_text_color || "#000" }}>
                <div className="animate-marquee whitespace-nowrap flex">
                  <span className="px-8">{s.ticker1_text || "..."}</span>
                  <span className="px-8">{s.ticker1_text || "..."}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ 2. TICKER 2 — bara cu mesaje multiple ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">2. Ticker 2 — Mesaje Multiple (Galbenă)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează Ticker 2" settingKey="ticker2_show" s={s} save={save} />

          <div className="space-y-2">
            <Label>Mesaje (reordonare, editare, ștergere)</Label>
            {messages.map((msg, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={msg} onChange={e => { const arr = [...messages]; arr[i] = e.target.value; setMessages(arr); }} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => moveMsg(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => moveMsg(i, 1)} disabled={i === messages.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setMessages(messages.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMessages([...messages, "Mesaj nou"])}><Plus className="h-4 w-4 mr-1" /> Adaugă mesaj</Button>
          </div>

          <SettingInput label="Separator" settingKey="ticker2_separator" s={s} save={save} placeholder="·" />
          <SettingColor label="Fundal" settingKey="ticker2_bg_color" s={s} save={save} />
          <SettingColor label="Text" settingKey="ticker2_text_color" s={s} save={save} />
          <div className="space-y-1">
            <Label>Viteză animație ({s.ticker2_speed || "40"}s)</Label>
            <Slider min={10} max={100} step={5} value={[parseInt(s.ticker2_speed || "40")]} onValueChange={([v]) => save("ticker2_speed", String(v))} />
          </div>
          <div className="space-y-1">
            <Label>Direcție</Label>
            <Select value={s.ticker2_direction || "left"} onValueChange={v => save("ticker2_direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Stânga → Dreapta</SelectItem>
                <SelectItem value="right">Dreapta → Stânga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {s.ticker2_show === "true" && (
            <div className="rounded border overflow-hidden">
              <div className="h-8 flex items-center overflow-hidden text-xs font-bold" style={{ backgroundColor: s.ticker2_bg_color || "#FFB800", color: s.ticker2_text_color || "#000" }}>
                <div className="animate-ticker whitespace-nowrap flex">
                  <span className="px-12">{messages.join(` ${s.ticker2_separator || "·"} `)}</span>
                  <span className="px-12">{messages.join(` ${s.ticker2_separator || "·"} `)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ 3. SOCIAL PROOF DIN COMENZI ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">3. Social Proof — Comenzi Reale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Activează Social Proof" settingKey="ticker_social_proof_show" s={s} save={save} />
          <div className="space-y-1">
            <Label>Poziție afișare</Label>
            <Select value={s.ticker_social_proof_position || "ticker2"} onValueChange={v => save("ticker_social_proof_position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ticker1">Ticker 1 (bara de sus)</SelectItem>
                <SelectItem value="ticker2">Ticker 2 (bara galbenă)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SettingInput label="Template mesaj" settingKey="ticker_social_proof_template" s={s} save={save} placeholder="{nume} din {oras} a cumpărat {produs}" />
          <div className="flex flex-wrap gap-1">
            {["{nume}", "{oras}", "{produs}", "{data}"].map(v => (
              <span key={v} className="px-2 py-0.5 bg-secondary text-xs rounded">{v}</span>
            ))}
          </div>
          <SettingToggle label="Anonimizare (doar prenume)" settingKey="ticker_social_proof_anonymize" s={s} save={save} />
          <div className="space-y-1">
            <Label>Nr. comenzi afișate (1-20)</Label>
            <Input type="number" min={1} max={20} value={s.ticker_social_proof_limit || "10"} onChange={e => save("ticker_social_proof_limit", e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview mesaje reale</Label>
              <Button variant="outline" size="sm" onClick={fetchSocialProof} disabled={loadingSP}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingSP ? "animate-spin" : ""}`} /> Regenerează
              </Button>
            </div>
            {socialPreview.length > 0 ? (
              <div className="border rounded p-3 space-y-1 text-sm bg-secondary/30">
                {socialPreview.map((msg, i) => <div key={i}>🛒 {msg}</div>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nu există comenzi recente pentru preview.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 4. BANNER AVERTISMENT GLOBAL ═══ */}
      <Card id="alert">
        <CardHeader><CardTitle className="text-base">4. Banner Avertisment Global</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează banner" settingKey="site_alert_show" s={s} save={save} />
          <div className="space-y-1">
            <Label>Text mesaj</Label>
            <Textarea value={s.site_alert_text || ""} onChange={e => save("site_alert_text", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Tip</Label>
            <Select value={s.site_alert_type || "info"} onValueChange={v => save("site_alert_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info (albastru)</SelectItem>
                <SelectItem value="warning">⚠️ Warning (portocaliu)</SelectItem>
                <SelectItem value="danger">🔴 Danger (roșu)</SelectItem>
                <SelectItem value="success">✅ Succes (verde)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SettingColor label="Fundal" settingKey="site_alert_bg_color" s={s} save={save} />
          <SettingColor label="Text" settingKey="site_alert_text_color" s={s} save={save} />
          <SettingToggle label="Poate fi închis de vizitator" settingKey="site_alert_dismissible" s={s} save={save} />
          <SettingInput label="Text link (opțional)" settingKey="site_alert_link_text" s={s} save={save} />
          <SettingInput label="URL link (opțional)" settingKey="site_alert_link_url" s={s} save={save} />

          {/* Preview */}
          {s.site_alert_show === "true" && s.site_alert_text && (
            <div className="rounded border overflow-hidden">
              <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium" style={{ backgroundColor: s.site_alert_bg_color || "#FF3300", color: s.site_alert_text_color || "#FFF" }}>
                <span>{s.site_alert_text}</span>
                {s.site_alert_link_text && <a href="#" className="underline font-bold">{s.site_alert_link_text}</a>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
