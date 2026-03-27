import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, GripVertical, Store, LayoutDashboard, Type, Eye, MoveUp, MoveDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TrustBarItem { icon: string; text: string; link: string }
interface BenefitItem { icon: string; text: string }
interface StoreBranding {
  name: string; emoji: string; tagline: string;
  phone: string; email: string; copyright: string;
}

export interface HomepageSection {
  key: string;
  label: string;
  visible: boolean;
  title?: string;
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  { key: "hero", label: "Hero Slider", visible: true },
  { key: "personalizare", label: "Secțiune Personalizare", visible: true },
  { key: "scent_quiz", label: "Quiz Parfum", visible: true },
  { key: "featured", label: "Produse Recomandate", visible: true, title: "Selecția Noastră" },
  { key: "flash", label: "Oferte Flash / Limitate", visible: true, title: "Oferte Limitate" },
  { key: "social_proof", label: "Social Proof Ticker", visible: true },
  { key: "bestsellers", label: "Cele Mai Iubite (Bestsellers)", visible: true, title: "Cele Mai Iubite" },
  { key: "why_ventuza", label: "De Ce VENTUZA", visible: true },
  { key: "process", label: "Procesul Nostru", visible: true },
  { key: "testimonials", label: "Testimoniale", visible: true },
  { key: "recently_viewed", label: "Produse Vizualizate Recent", visible: true },
  { key: "newsletter", label: "Newsletter / Reducere", visible: true },
  { key: "trust_strip", label: "Bara de Trust (Footer)", visible: true },
];

const iconOptions = [
  { value: "phone", label: "📞 Telefon" },
  { value: "shield", label: "🛡️ Garanție" },
  { value: "truck", label: "🚚 Livrare" },
  { value: "zap", label: "⚡ Flash" },
  { value: "rotate", label: "🔄 Returnare" },
  { value: "star", label: "⭐ Stea" },
  { value: "heart", label: "❤️ Inimă" },
  { value: "gift", label: "🎁 Cadou" },
  { value: "clock", label: "🕐 Ceas" },
  { value: "percent", label: "💯 Procent" },
];

export default function AdminHomepageSettings() {
  const [trustBar, setTrustBar] = useState<TrustBarItem[]>([]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [branding, setBranding] = useState<StoreBranding>({
    name: "VENTUZA", emoji: "🕯️", tagline: "", phone: "", email: "", copyright: "",
  });
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", ["header_trust_bar", "homepage_benefits", "store_branding", "homepage_section_order"])
      .then(({ data }) => {
        data?.forEach((row) => {
          const val = row.value_json;
          switch (row.key) {
            case "header_trust_bar":
              if (Array.isArray(val)) setTrustBar(val as unknown as TrustBarItem[]);
              break;
            case "homepage_benefits":
              if (Array.isArray(val)) setBenefits(val as unknown as BenefitItem[]);
              break;
            case "store_branding":
              if (val && typeof val === "object" && !Array.isArray(val)) setBranding(val as unknown as StoreBranding);
              break;
            case "homepage_section_order":
              if (Array.isArray(val)) {
                const saved = val as unknown as HomepageSection[];
                // Merge with defaults to pick up any new sections
                const merged = DEFAULT_SECTIONS.map(def => {
                  const found = saved.find(s => s.key === def.key);
                  return found ? { ...def, ...found } : def;
                });
                setSections(merged);
              }
              break;
          }
        });
        setLoading(false);
      });
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from("app_settings")
      .update({ value_json: value as any })
      .eq("key", key);
    if (error) {
      await supabase.from("app_settings").upsert({ key, value_json: value as any });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting("header_trust_bar", trustBar),
      saveSetting("homepage_benefits", benefits),
      saveSetting("store_branding", branding),
      saveSetting("homepage_section_order", sections),
    ]);
    toast.success("Setări homepage salvate!");
    setSaving(false);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr);
  };

  const toggleSection = (idx: number) => {
    const arr = [...sections];
    arr[idx] = { ...arr[idx], visible: !arr[idx].visible };
    setSections(arr);
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const arr = [...sections];
    arr[idx] = { ...arr[idx], title };
    setSections(arr);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări Homepage & Header</h1>
          <p className="text-sm text-muted-foreground">Editează tot ce apare pe pagina principală și în header</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Se salvează..." : "Salvează tot"}
        </Button>
      </div>

      {/* Store Branding */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="w-5 h-5 text-primary" /> Identitate Magazin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Emoji magazin</Label>
              <Input value={branding.emoji} onChange={(e) => setBranding({ ...branding, emoji: e.target.value })} placeholder="🛒" />
            </div>
            <div>
              <Label>Nume magazin</Label>
              <Input value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={branding.phone} onChange={(e) => setBranding({ ...branding, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email contact</Label>
              <Input value={branding.email} onChange={(e) => setBranding({ ...branding, email: e.target.value })} />
            </div>
            <div>
              <Label>Copyright footer</Label>
              <Input value={branding.copyright} onChange={(e) => setBranding({ ...branding, copyright: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Tagline (descriere scurtă footer)</Label>
            <Textarea value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Homepage Section Order & Visibility */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-primary" /> Secțiuni Homepage — Ordine & Vizibilitate
          </CardTitle>
          <p className="text-xs text-muted-foreground">Folosește săgețile pentru a schimba ordinea. Toggle-ul activează/dezactivează secțiunea.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section, idx) => (
            <div key={section.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${section.visible ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50 opacity-60"}`}>
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}</span>
              <Switch checked={section.visible} onCheckedChange={() => toggleSection(idx)} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{section.label}</span>
                {section.title !== undefined && (
                  <Input
                    className="mt-1 h-7 text-xs"
                    placeholder="Titlu secțiune personalizat"
                    value={section.title || ""}
                    onChange={(e) => updateSectionTitle(idx, e.target.value)}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                  <MoveUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                  <MoveDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trust Bar */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Bara de Trust (Header)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setTrustBar([...trustBar, { icon: "shield", text: "", link: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {trustBar.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={item.icon} onValueChange={(v) => {
                const arr = [...trustBar]; arr[i] = { ...arr[i], icon: v }; setTrustBar(arr);
              }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Text afișat" value={item.text}
                onChange={(e) => { const arr = [...trustBar]; arr[i] = { ...arr[i], text: e.target.value }; setTrustBar(arr); }}
              />
              <Input className="w-[200px]" placeholder="Link (opțional)" value={item.link}
                onChange={(e) => { const arr = [...trustBar]; arr[i] = { ...arr[i], link: e.target.value }; setTrustBar(arr); }}
              />
              <Button size="icon" variant="ghost" className="text-destructive shrink-0"
                onClick={() => setTrustBar(trustBar.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {trustBar.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun element. Adaugă cel puțin unul.</p>}
        </CardContent>
      </Card>

      {/* Benefits Bar */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Bara de Beneficii (Homepage)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setBenefits([...benefits, { icon: "star", text: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {benefits.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={item.icon} onValueChange={(v) => {
                const arr = [...benefits]; arr[i] = { ...arr[i], icon: v }; setBenefits(arr);
              }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Text afișat" value={item.text}
                onChange={(e) => { const arr = [...benefits]; arr[i] = { ...arr[i], text: e.target.value }; setBenefits(arr); }}
              />
              <Button size="icon" variant="ghost" className="text-destructive shrink-0"
                onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {benefits.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun element.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
