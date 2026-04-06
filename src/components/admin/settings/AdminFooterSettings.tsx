import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

/* ── Link editor helpers ── */
interface LinkItem { label: string; url: string }

function parseLinks(raw: string): LinkItem[] {
  if (!raw) return [];
  return raw.split("|").map(entry => {
    const idx = entry.indexOf(":");
    if (idx <= 0) return null;
    return { label: entry.slice(0, idx).trim(), url: entry.slice(idx + 1).trim() };
  }).filter(Boolean) as LinkItem[];
}

function serializeLinks(links: LinkItem[]): string {
  return links.filter(l => l.label && l.url).map(l => `${l.label}:${l.url}`).join("|");
}

/* ── Reusable link list editor ── */
function LinkListEditor({ links, setLinks, onSave, saving }: {
  links: LinkItem[];
  setLinks: (l: LinkItem[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Label" value={link.label} className="flex-1"
            onChange={e => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; setLinks(n); }} />
          <Input placeholder="/path sau https://..." value={link.url} className="flex-1"
            onChange={e => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; setLinks(n); }} />
          <Button variant="ghost" size="icon" className="text-destructive shrink-0"
            onClick={() => setLinks(links.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setLinks([...links, { label: "", url: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă link
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează lista
        </Button>
      </div>
    </div>
  );
}

/* ── Setting field helpers ── */
function SettingInput({ label, settingKey, s, save }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <Input defaultValue={s[settingKey] || ""} onBlur={e => save(settingKey, e.target.value)} />
    </div>
  );
}

function SettingToggle({ label, settingKey, s, save }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={s[settingKey] === "true"} onCheckedChange={v => save(settingKey, v ? "true" : "false")} />
    </div>
  );
}

function ColorField({ label, settingKey, s, save }: { label: string; settingKey: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  const val = s[settingKey] || "#000000";
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded border" style={{ background: val }} />
      <Input type="color" value={val} className="w-16 h-8 p-0 border-0" onChange={e => save(settingKey, e.target.value)} />
      <Label className="text-xs flex-1">{label}</Label>
      <code className="text-[10px] text-muted-foreground">{val}</code>
    </div>
  );
}

/* ── MAIN ── */
export default function AdminFooterSettings() {
  const { settings: s, updateSetting } = useSettings();
  const [col1Links, setCol1Links] = useState<LinkItem[]>([]);
  const [col2Links, setCol2Links] = useState<LinkItem[]>([]);
  const [savingLinks, setSavingLinks] = useState<string | null>(null);

  useEffect(() => {
    setCol1Links(parseLinks(s.footer_col1_links || ""));
  }, [s.footer_col1_links]);

  useEffect(() => {
    setCol2Links(parseLinks(s.footer_col2_links || ""));
  }, [s.footer_col2_links]);

  const save = async (key: string, value: string) => {
    await updateSetting(key, value);
    toast.success("Salvat ✓");
  };

  const saveLinks = async (key: string, links: LinkItem[]) => {
    setSavingLinks(key);
    await updateSetting(key, serializeLinks(links));
    toast.success("Salvat ✓");
    setSavingLinks(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Footer Manager</h1>
        <p className="text-sm text-muted-foreground">Controlează complet conținutul și aspectul footer-ului magazinului.</p>
      </div>

      {/* ═══ 1. Coloana Magazin ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Coloana Magazin</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează coloana" settingKey="footer_col1_show" s={s} save={save} />
          <SettingInput label="Titlu coloană" settingKey="footer_col1_title" s={s} save={save} />
          <Label className="text-xs font-medium">Linkuri</Label>
          <LinkListEditor links={col1Links} setLinks={setCol1Links}
            onSave={() => saveLinks("footer_col1_links", col1Links)}
            saving={savingLinks === "footer_col1_links"} />
        </CardContent>
      </Card>

      {/* ═══ 2. Coloana Clienți ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">2. Coloana Clienți</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează coloana" settingKey="footer_col2_show" s={s} save={save} />
          <SettingInput label="Titlu coloană" settingKey="footer_col2_title" s={s} save={save} />
          <Label className="text-xs font-medium">Linkuri</Label>
          <LinkListEditor links={col2Links} setLinks={setCol2Links}
            onSave={() => saveLinks("footer_col2_links", col2Links)}
            saving={savingLinks === "footer_col2_links"} />
        </CardContent>
      </Card>

      {/* ═══ 3. Date comerciale ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">3. Date comerciale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează coloana" settingKey="footer_col3_show" s={s} save={save} />
          <SettingToggle label="Afișează date legale" settingKey="footer_show_legal_data" s={s} save={save} />
          <SettingInput label="Titlu coloană" settingKey="footer_col3_title" s={s} save={save} />
          <SettingInput label="Nume firmă" settingKey="footer_company_name" s={s} save={save} />
          <SettingInput label="CUI" settingKey="footer_cui" s={s} save={save} />
          <SettingInput label="Reg. Com." settingKey="footer_reg_com" s={s} save={save} />
          <SettingInput label="Capital social" settingKey="footer_capital_social" s={s} save={save} />
          <SettingInput label="Stradă" settingKey="footer_address_street" s={s} save={save} />
          <SettingInput label="Oraș" settingKey="footer_address_city" s={s} save={save} />
        </CardContent>
      </Card>

      {/* ═══ 4. Suport clienți ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">4. Suport clienți</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează coloana" settingKey="footer_col4_show" s={s} save={save} />
          <SettingInput label="Titlu coloană" settingKey="footer_col4_title" s={s} save={save} />
          <div>
            <Label className="text-xs font-medium">Text program suport</Label>
            <Textarea defaultValue={s.footer_col4_support_text || ""} rows={3}
              onBlur={e => save("footer_col4_support_text", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SettingInput label="Telefon" settingKey="footer_phone" s={s} save={save} />
            <SettingToggle label="Afișează telefonul" settingKey="footer_show_phone" s={s} save={save} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SettingInput label="Email" settingKey="footer_email" s={s} save={save} />
            <SettingToggle label="Afișează email-ul" settingKey="footer_show_email" s={s} save={save} />
          </div>
          <SettingToggle label="Afișează buton contact" settingKey="footer_show_contact_btn" s={s} save={save} />
          <div className="grid grid-cols-2 gap-4">
            <SettingInput label="Text buton" settingKey="footer_contact_btn_text" s={s} save={save} />
            <SettingInput label="URL buton" settingKey="footer_contact_btn_url" s={s} save={save} />
          </div>
          <ColorField label="Culoare buton contact" settingKey="footer_contact_btn_color" s={s} save={save} />
        </CardContent>
      </Card>

      {/* ═══ 5. Social Media ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">5. Social Media</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează bloc social" settingKey="footer_social_show" s={s} save={save} />
          <SettingInput label="Facebook URL" settingKey="footer_facebook_url" s={s} save={save} />
          <SettingInput label="Instagram URL" settingKey="footer_instagram_url" s={s} save={save} />
          <SettingInput label="TikTok URL" settingKey="footer_tiktok_url" s={s} save={save} />
          <SettingInput label="YouTube URL" settingKey="footer_youtube_url" s={s} save={save} />
          <p className="text-xs text-muted-foreground">💡 Iconița apare automat pe site dacă URL-ul e completat.</p>
        </CardContent>
      </Card>

      {/* ═══ 6. ANPC / SAL / SOL ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">6. ANPC / SAL / SOL</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-3 rounded-lg border">
            <SettingToggle label="Afișează badge ANPC-SAL" settingKey="footer_anpc_show" s={s} save={save} />
            <SettingInput label="URL link ANPC" settingKey="footer_anpc_url" s={s} save={save} />
            <SettingInput label="URL logo ANPC-SAL" settingKey="footer_anpc_logo_url" s={s} save={save} />
            {s.footer_anpc_logo_url && (
              <div className="bg-muted/50 p-2 rounded">
                <img src={s.footer_anpc_logo_url} alt="ANPC preview" style={{ maxWidth: 250 }} className="object-contain" />
              </div>
            )}
          </div>
          <div className="space-y-3 p-3 rounded-lg border">
            <SettingToggle label="Afișează badge SOL" settingKey="footer_sal_show" s={s} save={save} />
            <SettingInput label="URL link SOL" settingKey="footer_sal_url" s={s} save={save} />
            <SettingInput label="URL logo SOL" settingKey="footer_sal_logo_url" s={s} save={save} />
            {s.footer_sal_logo_url && (
              <div className="bg-muted/50 p-2 rounded">
                <img src={s.footer_sal_logo_url} alt="SOL preview" style={{ maxWidth: 250 }} className="object-contain" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 7. Parteneri Marketplace ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">7. Parteneri Marketplace</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-muted-foreground">Dacă logo URL e gol → apare text badge. Dacă show=false → complet ascuns pe site.</p>
          {[
            { name: "eMAG", prefix: "footer_partner_emag" },
            { name: "Compari.ro", prefix: "footer_partner_compari" },
            { name: "Price.ro", prefix: "footer_partner_price" },
          ].map(p => (
            <div key={p.prefix} className="space-y-3 p-3 rounded-lg border">
              <SettingToggle label={`Afișează ${p.name}`} settingKey={`${p.prefix}_show`} s={s} save={save} />
              <SettingInput label="URL link" settingKey={`${p.prefix}_url`} s={s} save={save} />
              <SettingInput label="URL logo" settingKey={`${p.prefix}_logo`} s={s} save={save} />
              {s[`${p.prefix}_logo`] && (
                <div className="bg-muted/50 p-2 rounded">
                  <img src={s[`${p.prefix}_logo`]} alt={p.name} className="h-6 object-contain" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══ 8. Metode plată ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">8. Metode de plată</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle label="Afișează iconițe plată" settingKey="footer_show_payment_icons" s={s} save={save} />
          <div className="grid grid-cols-2 gap-3">
            <SettingToggle label="Netopia" settingKey="footer_payment_netopia_show" s={s} save={save} />
            <SettingToggle label="Visa" settingKey="footer_payment_visa_show" s={s} save={save} />
            <SettingToggle label="Mastercard" settingKey="footer_payment_mastercard_show" s={s} save={save} />
            <SettingToggle label="Ramburs" settingKey="footer_payment_ramburs_show" s={s} save={save} />
            <SettingToggle label="TBI Bank" settingKey="footer_payment_tbi_show" s={s} save={save} />
          </div>
        </CardContent>
      </Card>

      {/* ═══ 9. Culori footer ═══ */}
      <Card>
        <CardHeader><CardTitle className="text-base">9. Culori footer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ColorField label="Fundal footer (rând 1)" settingKey="footer_bg_color" s={s} save={save} />
          <ColorField label="Culoare titluri" settingKey="footer_title_color" s={s} save={save} />
          <ColorField label="Culoare text" settingKey="footer_text_color" s={s} save={save} />
          <ColorField label="Culoare linkuri" settingKey="footer_link_color" s={s} save={save} />
          <ColorField label="Culoare linkuri hover" settingKey="footer_link_hover_color" s={s} save={save} />
          <ColorField label="Fundal bottom bar" settingKey="footer_bottom_bg_color" s={s} save={save} />
          <ColorField label="Text bottom bar" settingKey="footer_bottom_text_color" s={s} save={save} />
        </CardContent>
      </Card>
    </div>
  );
}
