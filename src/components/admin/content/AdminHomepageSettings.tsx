import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, GripVertical, Store, LayoutDashboard, Type, Eye } from "lucide-react";
import { toast } from "sonner";

interface TrustBarItem { icon: string; text: string; link: string }
interface BenefitItem { icon: string; text: string }
interface StoreBranding {
  name: string; emoji: string; tagline: string;
  phone: string; email: string; copyright: string;
}
interface HomepageSections {
  featured_title: string; flash_title: string; bestsellers_title: string;
  show_featured: boolean; show_flash: boolean; show_bestsellers: boolean;
  show_brands: boolean; show_recently_viewed: boolean; show_blog: boolean; show_mokka: boolean;
}

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
    name: "MegaShop", emoji: "🛒", tagline: "", phone: "", email: "", copyright: "",
  });
  const [sections, setSections] = useState<HomepageSections>({
    featured_title: "Produse recomandate", flash_title: "Oferte Flash",
    bestsellers_title: "Cele mai vândute", show_featured: true, show_flash: true,
    show_bestsellers: true, show_brands: true, show_recently_viewed: true,
    show_blog: true, show_mokka: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", ["header_trust_bar", "homepage_benefits", "store_branding", "homepage_sections"])
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
            case "homepage_sections":
              if (val && typeof val === "object" && !Array.isArray(val)) setSections(val as unknown as HomepageSections);
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
      // Try upsert
      await supabase.from("app_settings").upsert({ key, value_json: value as any });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting("header_trust_bar", trustBar),
      saveSetting("homepage_benefits", benefits),
      saveSetting("store_branding", branding),
      saveSetting("homepage_sections", sections),
    ]);
    toast.success("Setări homepage salvate!");
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări Homepage & Header</h1>
          <p className="text-sm text-muted-foreground">Editează tot ce apare pe pagina principală și în header</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
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

      {/* Section Titles & Visibility */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-primary" /> Secțiuni Homepage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "show_featured" as const, titleKey: "featured_title" as const, label: "Produse recomandate" },
            { key: "show_flash" as const, titleKey: "flash_title" as const, label: "Oferte Flash" },
            { key: "show_bestsellers" as const, titleKey: "bestsellers_title" as const, label: "Cele mai vândute" },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <Switch checked={sections[s.key]} onCheckedChange={(v) => setSections({ ...sections, [s.key]: v })} />
              <div className="flex-1">
                <Label className="text-sm font-medium">{s.label}</Label>
                <Input className="mt-1" value={sections[s.titleKey]} placeholder="Titlu secțiune"
                  onChange={(e) => setSections({ ...sections, [s.titleKey]: e.target.value })}
                />
              </div>
            </div>
          ))}
          {[
            { key: "show_brands" as const, label: "Carusel Mărci" },
            { key: "show_recently_viewed" as const, label: "Produse vizualizate recent" },
            { key: "show_blog" as const, label: "Blog Preview" },
            { key: "show_mokka" as const, label: "Banner Mokka" },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <Switch checked={sections[s.key]} onCheckedChange={(v) => setSections({ ...sections, [s.key]: v })} />
              <Label className="text-sm font-medium">{s.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
