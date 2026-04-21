import { useCallback, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Palette, Type, Bell, Ruler, Plus, Trash2 } from "lucide-react";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  "Playfair Display", "Merriweather", "Nunito", "DM Sans", "Outfit", "Manrope",
  "Source Sans 3", "Noto Sans", "Oswald", "Rubik", "Barlow", "Quicksand", "Mulish",
];

interface ColorPickerRowProps {
  label: string;
  description: string;
  settingKey: string;
  value: string;
  onSave: (key: string, val: string) => void;
}

function ColorPickerRow({ label, description, settingKey, value, onSave }: ColorPickerRowProps) {
  const [local, setLocal] = useState(value);

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

export default function AdminThemeVisual() {
  const { settings, updateSetting } = useSettings();
  const [saveStatus, setSaveStatus] = useState("");

  const SYNC_MAP: Record<string, string> = {
    primary_color: "theme_primary_color",
    theme_primary_color: "primary_color",
    nav_bar_color: "theme_navbar_color",
    theme_navbar_color: "nav_bar_color",
    header_topbar_bg_color: "theme_topbar_color",
    theme_topbar_color: "header_topbar_bg_color",
    footer_bg_color: "theme_footer_color",
    theme_footer_color: "footer_bg_color",
  };

  const save = useCallback(async (key: string, value: string) => {
    const ok = await updateSetting(key, value);
    const mirror = SYNC_MAP[key];
    if (mirror) updateSetting(mirror, value);
    if (ok) {
      setSaveStatus("✅ Salvat");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  }, [updateSetting]);

  const get = (key: string, fallback: string) => settings[key] || fallback;

  // Ticker messages management
  let tickerMessages: string[] = [];
  try {
    const raw = settings._raw_ticker_messages || settings.ticker_messages;
    if (raw) tickerMessages = JSON.parse(raw);
  } catch {}

  const updateTickerMessages = (msgs: string[]) => {
    save("ticker_messages", JSON.stringify(msgs));
  };

  const resetDefaults = () => {
    save("theme_primary_color", "#2563eb");
    save("theme_navbar_color", "#333333");
    save("theme_topbar_color", "#222222");
    save("theme_footer_color", "#1f1f1f");
    save("theme_ticker_color", "#d32f2f");
    save("primary_color", "#2563eb");
    save("secondary_color", "#333333");
    save("accent_color", "#2563eb");
    save("background_color", "#ffffff");
    save("text_color", "#111111");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Temă Vizuală
        </h2>
        {saveStatus && <span className="text-sm text-green-600">{saveStatus}</span>}
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="colors" className="gap-1"><Palette className="w-3.5 h-3.5" /> Culori</TabsTrigger>
          <TabsTrigger value="fonts" className="gap-1"><Type className="w-3.5 h-3.5" /> Fonturi</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1"><Bell className="w-3.5 h-3.5" /> Notificări</TabsTrigger>
          <TabsTrigger value="dimensions" className="gap-1"><Ruler className="w-3.5 h-3.5" /> Dimensiuni</TabsTrigger>
        </TabsList>

        {/* TAB 1 — CULORI */}
        <TabsContent value="colors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Culori Brand</CardTitle></CardHeader>
              <CardContent>
                <ColorPickerRow label="Primară" description="Butoane, link-uri, CTA" settingKey="primary_color" value={get("primary_color", "#2563eb")} onSave={save} />
                <ColorPickerRow label="Secundară" description="Elemente dark, navigare" settingKey="secondary_color" value={get("secondary_color", "#333333")} onSave={save} />
                <ColorPickerRow label="Accent" description="Badge-uri, hover" settingKey="accent_color" value={get("accent_color", "#2563eb")} onSave={save} />
                <ColorPickerRow label="Fundal" description="Background site" settingKey="background_color" value={get("background_color", "#ffffff")} onSave={save} />
                <ColorPickerRow label="Text" description="Culoare text principal" settingKey="text_color" value={get("text_color", "#111111")} onSave={save} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Secțiuni</CardTitle></CardHeader>
              <CardContent>
                <ColorPickerRow label="Navbar" description="Bara navigare" settingKey="nav_bar_color" value={get("nav_bar_color", "#333333")} onSave={save} />
                <ColorPickerRow label="Topbar" description="Bara info sus" settingKey="header_topbar_bg_color" value={get("header_topbar_bg_color", "#222222")} onSave={save} />
                <ColorPickerRow label="Ticker" description="Bara promoții" settingKey="ticker_bg_color" value={get("ticker_bg_color", "#d32f2f")} onSave={save} />
                <ColorPickerRow label="Footer" description="Footer principal" settingKey="footer_bg_color" value={get("footer_bg_color", "#1f1f1f")} onSave={save} />
                <ColorPickerRow label="Badge Nou" description="Etichetă NOU" settingKey="badge_new_color" value={get("badge_new_color", "#16a34a")} onSave={save} />
                <ColorPickerRow label="Badge Reducere" description="Etichetă -X%" settingKey="badge_sale_color" value={get("badge_sale_color", "#dc2626")} onSave={save} />
                <ColorPickerRow label="Preț" description="Culoare preț" settingKey="product_price_color" value={get("product_price_color", "#dc2626")} onSave={save} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="pt-4">
                <Button variant="outline" size="sm" onClick={resetDefaults}>
                  Resetează la default
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2 — FONTURI */}
        <TabsContent value="fonts">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label className="text-sm font-medium">Font Titluri</Label>
                <Select value={get("heading_font", "Inter")} onValueChange={v => save("heading_font", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
                <p className="mt-2 text-lg" style={{ fontFamily: get("heading_font", "Inter") }}>
                  Previzualizare titlu cu fontul selectat
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Font Body</Label>
                <Select value={get("body_font", "Inter")} onValueChange={v => save("body_font", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
                <p className="mt-2 text-sm" style={{ fontFamily: get("body_font", "Inter") }}>
                  Previzualizare text body cu fontul selectat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — NOTIFICĂRI */}
        <TabsContent value="notifications">
          <div className="space-y-4">
            {/* Ticker */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ticker Promoțional</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Mesaje ticker</Label>
                  {tickerMessages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={msg}
                        onChange={e => {
                          const updated = [...tickerMessages];
                          updated[i] = e.target.value;
                          updateTickerMessages(updated);
                        }}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button variant="ghost" size="sm" onClick={() => {
                        updateTickerMessages(tickerMessages.filter((_, idx) => idx !== i));
                      }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateTickerMessages([...tickerMessages, "Mesaj nou"])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adaugă mesaj
                  </Button>
                </div>
                <ColorPickerRow label="Fundal ticker" description="" settingKey="ticker_bg_color" value={get("ticker_bg_color", "#d32f2f")} onSave={save} />
                <ColorPickerRow label="Text ticker" description="" settingKey="ticker_text_color" value={get("ticker_text_color", "#ffffff")} onSave={save} />
                <div>
                  <Label className="text-xs">Viteză: {get("ticker_speed", "25")}s</Label>
                  <Slider
                    value={[parseInt(get("ticker_speed", "25"))]}
                    onValueChange={([v]) => save("ticker_speed", String(v))}
                    min={10} max={60} step={1} className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Popup Newsletter */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Popup Newsletter</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Activ</Label>
                  <Switch
                    checked={get("popup_show", "true") === "true"}
                    onCheckedChange={v => save("popup_show", v ? "true" : "false")}
                  />
                </div>
                <div>
                  <Label className="text-xs">Delay (secunde): {get("popup_delay_seconds", "3")}</Label>
                  <Slider
                    value={[parseInt(get("popup_delay_seconds", "3"))]}
                    onValueChange={([v]) => save("popup_delay_seconds", String(v))}
                    min={1} max={30} step={1} className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cod reducere</Label>
                  <Input value={get("popup_discount_code", "WELCOME10")} onChange={e => save("popup_discount_code", e.target.value)} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Procent reducere</Label>
                  <Input value={get("popup_discount_percent", "10")} onChange={e => save("popup_discount_percent", e.target.value)} className="h-8 text-xs mt-1" />
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Social Proof Toast</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Activ</Label>
                  <Switch
                    checked={get("social_proof_show", "true") === "true"}
                    onCheckedChange={v => save("social_proof_show", v ? "true" : "false")}
                  />
                </div>
                <div>
                  <Label className="text-xs">Interval (secunde): {get("social_proof_interval_seconds", "12")}</Label>
                  <Slider
                    value={[parseInt(get("social_proof_interval_seconds", "12"))]}
                    onValueChange={([v]) => save("social_proof_interval_seconds", String(v))}
                    min={5} max={60} step={1} className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Buton WhatsApp</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Activ</Label>
                  <Switch
                    checked={get("whatsapp_show", "true") === "true"}
                    onCheckedChange={v => save("whatsapp_show", v ? "true" : "false")}
                  />
                </div>
                <div>
                  <Label className="text-xs">Număr telefon (cu prefix țară)</Label>
                  <Input value={get("whatsapp_number", "")} onChange={e => save("whatsapp_number", e.target.value)} className="h-8 text-xs mt-1" placeholder="40753326405" />
                </div>
                <div>
                  <Label className="text-xs">Mesaj precompletat</Label>
                  <Input value={get("whatsapp_message", "")} onChange={e => save("whatsapp_message", e.target.value)} className="h-8 text-xs mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4 — DIMENSIUNI */}
        <TabsContent value="dimensions">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label className="text-sm">Lățime container: {get("theme_container_width", "1280px")}</Label>
                <Slider
                  value={[parseInt(get("theme_container_width", "1280"))]}
                  onValueChange={([v]) => save("theme_container_width", `${v}px`)}
                  min={1200} max={1600} step={40} className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">Border radius carduri: {get("theme_radius_card", "4px")}</Label>
                <Slider
                  value={[parseInt(get("theme_radius_card", "4"))]}
                  onValueChange={([v]) => save("theme_radius_card", `${v}px`)}
                  min={0} max={16} step={1} className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">Border radius butoane: {get("theme_radius_btn", "4px")}</Label>
                <Slider
                  value={[parseInt(get("theme_radius_btn", "4"))]}
                  onValueChange={([v]) => save("theme_radius_btn", `${v}px`)}
                  min={0} max={16} step={1} className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">Rotunjire globală: {get("btn_border_radius", "4")}px</Label>
                <Slider
                  value={[parseInt(get("btn_border_radius", "4"))]}
                  onValueChange={([v]) => save("btn_border_radius", String(v))}
                  min={0} max={50} step={1} className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
