import { useCallback, useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Type, MousePointer, Loader2, Monitor } from "lucide-react";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  "Playfair Display", "Merriweather", "Nunito", "DM Sans", "Outfit", "Manrope",
];

interface ColorRowProps {
  label: string;
  description: string;
  settingKey: string;
  value: string;
  onSave: (key: string, val: string) => void;
}

function ColorRow({ label, description, settingKey, value, onSave }: ColorRowProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  const commit = (v: string) => {
    setLocal(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onSave(settingKey, v);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
      <div className="w-8 h-8 rounded-full border-2 border-border shrink-0" style={{ background: local }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Input value={local} onChange={e => commit(e.target.value)} className="w-[90px] h-7 text-xs font-mono" />
      <input type="color" value={local} onChange={e => commit(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer p-0 shrink-0" />
    </div>
  );
}

export default function ControlTheme() {
  const { settings, updateSetting } = useSettings();
  const [saveStatus, setSaveStatus] = useState("");

  const save = useCallback(async (key: string, value: string) => {
    const ok = await updateSetting(key, value);
    if (ok) {
      setSaveStatus("✅ Salvat");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  }, [updateSetting]);

  const get = (key: string, fallback: string) => settings[key] || fallback;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Temă & Culori
        </h2>
        {saveStatus && <span className="text-sm text-green-600">{saveStatus}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Culori Brand</CardTitle></CardHeader>
          <CardContent>
            <ColorRow label="Primară" description="Butoane, navigare" settingKey="primary_color" value={get("primary_color", "#0066FF")} onSave={save} />
            <ColorRow label="Secundară" description="Elemente dark" settingKey="secondary_color" value={get("secondary_color", "#111111")} onSave={save} />
            <ColorRow label="Accent" description="CTA, badge-uri" settingKey="accent_color" value={get("accent_color", "#FF3300")} onSave={save} />
            <ColorRow label="Fundal" description="Background site" settingKey="background_color" value={get("background_color", "#FFFFFF")} onSave={save} />
            <ColorRow label="Text" description="Culoare text" settingKey="text_color" value={get("text_color", "#111827")} onSave={save} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Header & Secțiuni</CardTitle></CardHeader>
          <CardContent>
            <ColorRow label="Header BG" description="Fundal header" settingKey="header_bg" value={get("header_bg", "#FFFFFF")} onSave={save} />
            <ColorRow label="Nav Bar" description="Bara navigare" settingKey="nav_bar_color" value={get("nav_bar_color", "#0066FF")} onSave={save} />
            <ColorRow label="Announcement" description="Bara promoții" settingKey="announcement_bg" value={get("announcement_bg", "#FF3300")} onSave={save} />
            <ColorRow label="Trust Strip" description="Bara încredere" settingKey="trust_strip_color" value={get("trust_strip_color", "#0066FF")} onSave={save} />
            <ColorRow label="Footer Top" description="Footer superior" settingKey="footer_upper_bg" value={get("footer_upper_bg", "#1A2332")} onSave={save} />
            <ColorRow label="Footer Bot" description="Footer inferior" settingKey="footer_lower_bg" value={get("footer_lower_bg", "#111111")} onSave={save} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><MousePointer className="w-4 h-4" /> Butoane</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ColorRow label="Buton BG" description="Fundal buton" settingKey="btn_primary_bg" value={get("btn_primary_bg", "#0066FF")} onSave={save} />
            <ColorRow label="Buton Text" description="Text buton" settingKey="btn_primary_text" value={get("btn_primary_text", "#FFFFFF")} onSave={save} />
            <ColorRow label="CTA BG" description="Fundal CTA" settingKey="cta_bg" value={get("cta_bg", "#FF3300")} onSave={save} />
            <div>
              <Label className="text-xs">Rotunjire: {get("btn_border_radius", "6")}px</Label>
              <Slider
                value={[parseInt(get("btn_border_radius", "6"))]}
                onValueChange={([v]) => save("btn_border_radius", String(v))}
                min={0} max={50} step={1} className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Type className="w-4 h-4" /> Tipografie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Font Titluri</Label>
              <Select value={get("heading_font", "Inter")} onValueChange={v => save("heading_font", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Font Body</Label>
              <Select value={get("body_font", "Inter")} onValueChange={v => save("body_font", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
