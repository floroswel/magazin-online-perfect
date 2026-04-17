import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, GripVertical, LayoutDashboard, Eye, MoveUp, MoveDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

interface TrustBarItem { icon: string; text: string; link: string }
interface BenefitItem { icon: string; text: string }

const SECTIONS = [
  { key: "show_hero", label: "Hero Slider", icon: "🖼️", titleKey: null },
  { key: "show_flash_deals", label: "Flash Deals", icon: "⚡", titleKey: "flash_deals_title" },
  { key: "show_categories", label: "Categorii", icon: "🗂️", titleKey: "categories_title" },
  { key: "show_promo_banners", label: "Bannere Promo", icon: "🎯", titleKey: null },
  { key: "show_featured", label: "Bestsellers", icon: "⭐", titleKey: "bestsellers_title" },
  { key: "show_trust", label: "Trust Strip", icon: "🔒", titleKey: null },
  { key: "show_new_arrivals", label: "Noutăți", icon: "🆕", titleKey: "new_arrivals_title" },
  { key: "show_recently_viewed", label: "Văzute Recent", icon: "👁️", titleKey: null },
  { key: "show_newsletter", label: "Newsletter", icon: "📧", titleKey: "newsletter_title" },
  { key: "show_social_proof", label: "Social Proof", icon: "💬", titleKey: null },
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
  const { settings, updateSetting } = useSettings();

  // Trust bar from app_settings
  const trustBar: TrustBarItem[] = (() => {
    try { return JSON.parse(settings._raw_header_trust_bar || "[]"); } catch { return []; }
  })();
  const saveTrustBar = (items: TrustBarItem[]) => updateSetting("header_trust_bar", JSON.stringify(items));

  // Benefits bar from app_settings
  const benefits: BenefitItem[] = (() => {
    try { return JSON.parse(settings._raw_homepage_benefits || "[]"); } catch { return []; }
  })();
  const saveBenefits = (items: BenefitItem[]) => updateSetting("homepage_benefits", JSON.stringify(items));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Setări Homepage</h1>
        <p className="text-sm text-muted-foreground">Controlează secțiunile, trust bar și beneficii de pe pagina principală</p>
      </div>

      {/* ═══ Section Visibility & Titles ═══ */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-primary" /> Secțiuni Homepage — Vizibilitate & Titluri
          </CardTitle>
          <p className="text-xs text-muted-foreground">Activează/dezactivează secțiunile de pe homepage. Modificările se aplică instant.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {SECTIONS.map((section) => {
            const isVisible = settings[section.key] !== "false";
            return (
              <div key={section.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isVisible ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50 opacity-60"}`}>
                <span className="text-lg">{section.icon}</span>
                <Switch
                  checked={isVisible}
                  onCheckedChange={(v) => updateSetting(section.key, v ? "true" : "false")}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{section.label}</span>
                  {section.titleKey && (
                    <Input
                      className="mt-1 h-7 text-xs"
                      placeholder={`Titlu ${section.label}`}
                      value={settings[section.titleKey] || ""}
                      onChange={(e) => updateSetting(section.titleKey!, e.target.value)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ═══ Trust Bar ═══ */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Bara de Trust (Header)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => saveTrustBar([...trustBar, { icon: "shield", text: "", link: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {trustBar.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={item.icon} onValueChange={(v) => {
                const arr = [...trustBar]; arr[i] = { ...arr[i], icon: v }; saveTrustBar(arr);
              }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Text afișat" value={item.text}
                onChange={(e) => { const arr = [...trustBar]; arr[i] = { ...arr[i], text: e.target.value }; saveTrustBar(arr); }}
              />
              <Input className="w-[200px]" placeholder="Link (opțional)" value={item.link}
                onChange={(e) => { const arr = [...trustBar]; arr[i] = { ...arr[i], link: e.target.value }; saveTrustBar(arr); }}
              />
              <Button size="icon" variant="ghost" className="text-destructive shrink-0"
                onClick={() => saveTrustBar(trustBar.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {trustBar.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Niciun element. Adaugă cel puțin unul.</p>}
        </CardContent>
      </Card>

      {/* ═══ Benefits Bar ═══ */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Bara de Beneficii (Homepage)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => saveBenefits([...benefits, { icon: "star", text: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {benefits.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={item.icon} onValueChange={(v) => {
                const arr = [...benefits]; arr[i] = { ...arr[i], icon: v }; saveBenefits(arr);
              }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Text afișat" value={item.text}
                onChange={(e) => { const arr = [...benefits]; arr[i] = { ...arr[i], text: e.target.value }; saveBenefits(arr); }}
              />
              <Button size="icon" variant="ghost" className="text-destructive shrink-0"
                onClick={() => saveBenefits(benefits.filter((_, j) => j !== i))}>
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
