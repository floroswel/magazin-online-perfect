import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Save, Eye, Plus, Trash2, Loader2, BarChart3, ShoppingBag, Star, Users, AlertTriangle, MessageSquare, Palette, Settings } from "lucide-react";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────
interface SocialProofSettings {
  enabled: boolean;
  show_on_pages: string[];
  initial_delay_sec: number;
  display_duration_sec: number;
  interval_between_sec: number;
  cooldown_after_close_min: number;
  max_per_session: number;
  position: string;
  show_mobile: boolean;
  show_desktop: boolean;
  // purchases
  purchases_enabled: boolean;
  purchases_source: string;
  purchases_days_back: number;
  purchases_max_age_days: number;
  name_format: string;
  purchases_template: string;
  show_product_image: boolean;
  show_time_ago: boolean;
  time_format: string;
  // reviews
  reviews_enabled: boolean;
  reviews_min_stars: number;
  reviews_days_back: number;
  reviews_template: string;
  // visitors
  visitors_enabled: boolean;
  visitors_mode: string;
  visitors_simulated_count: number;
  visitors_min_to_show: number;
  visitors_update_interval_sec: number;
  visitors_global_template: string;
  visitors_product_template: string;
  // stock
  stock_enabled: boolean;
  stock_threshold: number;
  stock_template: string;
  stock_product_page_only: boolean;
  // design
  card_bg_color: string;
  text_color: string;
  accent_color: string;
  border_radius_px: number;
  font_size_px: number;
  shadow_intensity: number;
  animation_style: string;
}

interface SimulatedEntry {
  id?: string;
  first_name: string;
  city: string;
  product_name: string;
  product_image?: string;
  time_display: string;
  type: string;
  active: boolean;
  sort_order: number;
}

interface CustomMessage {
  id?: string;
  message_text: string;
  icon_type: string;
  icon_value: string;
  link_url: string;
  valid_from: string;
  valid_to: string;
  priority: number;
  active: boolean;
  sort_order: number;
}

const DEFAULTS: SocialProofSettings = {
  enabled: true,
  show_on_pages: ["all"],
  initial_delay_sec: 5,
  display_duration_sec: 6,
  interval_between_sec: 4,
  cooldown_after_close_min: 5,
  max_per_session: 8,
  position: "bottom-left",
  show_mobile: true,
  show_desktop: true,
  purchases_enabled: true,
  purchases_source: "real",
  purchases_days_back: 30,
  purchases_max_age_days: 90,
  name_format: "name_city",
  purchases_template: "{name} a cumpărat {product}",
  show_product_image: true,
  show_time_ago: true,
  time_format: "relative",
  reviews_enabled: false,
  reviews_min_stars: 5,
  reviews_days_back: 60,
  reviews_template: "{name} a lăsat ⭐⭐⭐⭐⭐ pentru {product}",
  visitors_enabled: false,
  visitors_mode: "simulated",
  visitors_simulated_count: 15,
  visitors_min_to_show: 3,
  visitors_update_interval_sec: 30,
  visitors_global_template: "👀 {count} persoane în magazin acum",
  visitors_product_template: "🔥 {count} persoane se uită la acest produs acum",
  stock_enabled: false,
  stock_threshold: 5,
  stock_template: "⚠️ Doar {stock} bucăți rămase din {product}",
  stock_product_page_only: true,
  card_bg_color: "",
  text_color: "",
  accent_color: "",
  border_radius_px: 12,
  font_size_px: 13,
  shadow_intensity: 2,
  animation_style: "slide-left",
};

const PAGE_OPTIONS = [
  { value: "all", label: "Toate paginile" },
  { value: "home", label: "Pagina principală" },
  { value: "product", label: "Pagini produse" },
  { value: "category", label: "Pagini categorii" },
  { value: "cart", label: "Coș de cumpărături" },
  { value: "confirmation", label: "Confirmare comandă" },
  { value: "personalizare", label: "Personalizare" },
];

export default function AdminSocialProofSettings() {
  const [settings, setSettings] = useState<SocialProofSettings>(DEFAULTS);
  const [simulated, setSimulated] = useState<SimulatedEntry[]>([]);
  const [customMessages, setCustomMessages] = useState<CustomMessage[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("value_json").eq("key", "social_proof_settings").maybeSingle(),
      supabase.from("social_proof_simulated").select("*").order("sort_order"),
      supabase.from("social_proof_custom_messages").select("*").order("sort_order"),
      supabase.from("social_proof_analytics").select("notification_type, was_clicked, was_dismissed, created_at").order("created_at", { ascending: false }).limit(500),
    ]).then(([settingsRes, simRes, msgRes, analyticsRes]) => {
      if (settingsRes.data?.value_json) setSettings(s => ({ ...s, ...(settingsRes.data.value_json as any) }));
      if (simRes.data) setSimulated(simRes.data as any);
      if (msgRes.data) setCustomMessages(msgRes.data as any);
      if (analyticsRes.data) {
        const data = analyticsRes.data as any[];
        setAnalytics({
          total: data.length,
          clicked: data.filter(d => d.was_clicked).length,
          dismissed: data.filter(d => d.was_dismissed).length,
          byType: data.reduce((acc: any, d: any) => { acc[d.notification_type] = (acc[d.notification_type] || 0) + 1; return acc; }, {}),
        });
      }
      setLoading(false);
    });
  }, []);

  const saveSettings = useCallback(async () => {
    setSaving("settings");
    await supabase.from("app_settings").upsert(
      { key: "social_proof_settings", value_json: settings as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(null);
    toast.success("Setări Social Proof salvate!");
  }, [settings]);

  const saveSimulated = useCallback(async () => {
    setSaving("simulated");
    // Delete all then re-insert
    await supabase.from("social_proof_simulated").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (simulated.length > 0) {
      await supabase.from("social_proof_simulated").insert(
        simulated.map((s, i) => ({
          first_name: s.first_name, city: s.city, product_name: s.product_name,
          product_image: s.product_image || null, time_display: s.time_display,
          type: s.type, active: s.active, sort_order: i,
        }))
      );
    }
    setSaving(null);
    toast.success("Date simulate salvate!");
  }, [simulated]);

  const saveCustomMessages = useCallback(async () => {
    setSaving("messages");
    await supabase.from("social_proof_custom_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (customMessages.length > 0) {
      await supabase.from("social_proof_custom_messages").insert(
        customMessages.map((m, i) => ({
          message_text: m.message_text, icon_type: m.icon_type, icon_value: m.icon_value,
          link_url: m.link_url || null, valid_from: m.valid_from || null, valid_to: m.valid_to || null,
          priority: m.priority, active: m.active, sort_order: i,
        }))
      );
    }
    setSaving(null);
    toast.success("Mesaje custom salvate!");
  }, [customMessages]);

  const set = <K extends keyof SocialProofSettings>(key: K, val: SocialProofSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const togglePage = (page: string) => {
    setSettings(prev => {
      const pages = prev.show_on_pages.includes(page)
        ? prev.show_on_pages.filter(p => p !== page)
        : [...prev.show_on_pages, page];
      return { ...prev, show_on_pages: pages };
    });
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Eye className="w-5 h-5" /> Social Proof Notifications</h1>
          <p className="text-sm text-muted-foreground">Notificări live de cumpărări, recenzii și activitate pentru creșterea conversiei</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Activat global</Label>
            <Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} />
          </div>
          <Button onClick={saveSettings} disabled={saving === "settings"}>
            {saving === "settings" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Salvează
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general"><Settings className="w-3.5 h-3.5 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="purchases"><ShoppingBag className="w-3.5 h-3.5 mr-1" /> Cumpărări</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="w-3.5 h-3.5 mr-1" /> Recenzii</TabsTrigger>
          <TabsTrigger value="visitors"><Users className="w-3.5 h-3.5 mr-1" /> Vizitatori</TabsTrigger>
          <TabsTrigger value="stock"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Stoc</TabsTrigger>
          <TabsTrigger value="custom"><MessageSquare className="w-3.5 h-3.5 mr-1" /> Custom</TabsTrigger>
          <TabsTrigger value="design"><Palette className="w-3.5 h-3.5 mr-1" /> Design</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-3.5 h-3.5 mr-1" /> Statistici</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: GENERAL ═══ */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pagini active</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PAGE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settings.show_on_pages.includes(opt.value)}
                    onChange={() => togglePage(opt.value)} className="rounded border-input" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
              <p className="text-xs text-muted-foreground mt-2">⚠️ Checkout-ul este întotdeauna exclus automat pentru a nu distrage la plată.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Timing</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Întârziere inițială (sec)</Label>
                <Input type="number" value={settings.initial_delay_sec} onChange={e => set("initial_delay_sec", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Durată afișare (sec)</Label>
                <Input type="number" value={settings.display_duration_sec} onChange={e => set("display_duration_sec", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Interval între notificări (sec)</Label>
                <Input type="number" value={settings.interval_between_sec} onChange={e => set("interval_between_sec", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Cooldown după închidere (min)</Label>
                <Input type="number" value={settings.cooldown_after_close_min} onChange={e => set("cooldown_after_close_min", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Max notificări per sesiune</Label>
                <Input type="number" value={settings.max_per_session} onChange={e => set("max_per_session", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Poziție & Dispozitive</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Poziție popup</Label>
                <Select value={settings.position} onValueChange={v => set("position", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">⬇️ Stânga jos (recomandat)</SelectItem>
                    <SelectItem value="bottom-right">⬇️ Dreapta jos</SelectItem>
                    <SelectItem value="top-left">⬆️ Stânga sus</SelectItem>
                    <SelectItem value="top-right">⬆️ Dreapta sus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Afișează pe mobil</Label>
                <Switch checked={settings.show_mobile} onCheckedChange={v => set("show_mobile", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Afișează pe desktop</Label>
                <Switch checked={settings.show_desktop} onCheckedChange={v => set("show_desktop", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2: PURCHASES ═══ */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificări Cumpărări</CardTitle>
                <Switch checked={settings.purchases_enabled} onCheckedChange={v => set("purchases_enabled", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Sursă date</Label>
                <Select value={settings.purchases_source} onValueChange={v => set("purchases_source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">Comenzi reale din magazin</SelectItem>
                    <SelectItem value="mixed">Date mixte (reale + simulate)</SelectItem>
                    <SelectItem value="simulated">Doar date simulate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ultimele X zile comenzi</Label>
                  <Input type="number" value={settings.purchases_days_back} onChange={e => set("purchases_days_back", +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Ascunde comenzi mai vechi de (zile)</Label>
                  <Input type="number" value={settings.purchases_max_age_days} onChange={e => set("purchases_max_age_days", +e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Format nume client</Label>
                <Select value={settings.name_format} onValueChange={v => set("name_format", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_city">Prenume + Oraș (Ana din Cluj)</SelectItem>
                    <SelectItem value="name_initial">Prenume + Inițială (Ana M.)</SelectItem>
                    <SelectItem value="name_only">Doar prenume (Ana)</SelectItem>
                    <SelectItem value="anonymous">Anonim (Un client)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Template notificare</Label>
                <Input value={settings.purchases_template} onChange={e => set("purchases_template", e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">Variabile: {"{name}"} {"{city}"} {"{product}"} {"{time_ago}"}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Imagine produs</Label>
                <Switch checked={settings.show_product_image} onCheckedChange={v => set("show_product_image", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Afișează timp</Label>
                <Switch checked={settings.show_time_ago} onCheckedChange={v => set("show_time_ago", v)} />
              </div>
              <div>
                <Label className="text-xs">Format timp</Label>
                <Select value={settings.time_format} onValueChange={v => set("time_format", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relative">Relativ (acum 5 minute)</SelectItem>
                    <SelectItem value="exact">Exact (15 Mar, 14:32)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Simulated data */}
          {(settings.purchases_source === "simulated" || settings.purchases_source === "mixed") && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Date simulate</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSimulated(prev => [...prev, {
                      first_name: "", city: "", product_name: "", time_display: "acum 5 minute",
                      type: "purchase", active: true, sort_order: prev.length,
                    }])}><Plus className="w-3.5 h-3.5 mr-1" /> Adaugă</Button>
                    <Button size="sm" onClick={saveSimulated} disabled={saving === "simulated"}>
                      {saving === "simulated" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Salvează
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {simulated.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nicio intrare simulată.</p>}
                {simulated.map((entry, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 items-end border rounded-lg p-2">
                    <div>
                      <Label className="text-[10px]">Prenume</Label>
                      <Input value={entry.first_name} onChange={e => setSimulated(prev => prev.map((s, idx) => idx === i ? { ...s, first_name: e.target.value } : s))} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Oraș</Label>
                      <Input value={entry.city} onChange={e => setSimulated(prev => prev.map((s, idx) => idx === i ? { ...s, city: e.target.value } : s))} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Produs</Label>
                      <Input value={entry.product_name} onChange={e => setSimulated(prev => prev.map((s, idx) => idx === i ? { ...s, product_name: e.target.value } : s))} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Timp afișat</Label>
                      <Input value={entry.time_display} onChange={e => setSimulated(prev => prev.map((s, idx) => idx === i ? { ...s, time_display: e.target.value } : s))} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-end gap-1">
                      <Switch checked={entry.active} onCheckedChange={v => setSimulated(prev => prev.map((s, idx) => idx === i ? { ...s, active: v } : s))} />
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setSimulated(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB 3: REVIEWS ═══ */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificări Recenzii</CardTitle>
                <Switch checked={settings.reviews_enabled} onCheckedChange={v => set("reviews_enabled", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Afișează doar recenzii cu minim</Label>
                <Select value={String(settings.reviews_min_stars)} onValueChange={v => set("reviews_min_stars", +v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3+ stele</SelectItem>
                    <SelectItem value="4">4+ stele</SelectItem>
                    <SelectItem value="5">5 stele doar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ultimele X zile recenzii</Label>
                <Input type="number" value={settings.reviews_days_back} onChange={e => set("reviews_days_back", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Template notificare</Label>
                <Input value={settings.reviews_template} onChange={e => set("reviews_template", e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">Variabile: {"{name}"} {"{product}"} {"{rating}"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: VISITORS ═══ */}
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vizitatori Activi</CardTitle>
                <Switch checked={settings.visitors_enabled} onCheckedChange={v => set("visitors_enabled", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Mod date</Label>
                <Select value={settings.visitors_mode} onValueChange={v => set("visitors_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">Real (sesiuni active)</SelectItem>
                    <SelectItem value="simulated">Simulat (număr configurat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Număr simulat</Label>
                  <Input type="number" value={settings.visitors_simulated_count} onChange={e => set("visitors_simulated_count", +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Minim pentru afișare</Label>
                  <Input type="number" value={settings.visitors_min_to_show} onChange={e => set("visitors_min_to_show", +e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Template global</Label>
                <Input value={settings.visitors_global_template} onChange={e => set("visitors_global_template", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Template pagină produs</Label>
                <Input value={settings.visitors_product_template} onChange={e => set("visitors_product_template", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Actualizare la fiecare (sec)</Label>
                <Input type="number" value={settings.visitors_update_interval_sec} onChange={e => set("visitors_update_interval_sec", +e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 5: STOCK ═══ */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stoc Scăzut</CardTitle>
                <Switch checked={settings.stock_enabled} onCheckedChange={v => set("stock_enabled", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Afișează când stoc ≤</Label>
                <Input type="number" value={settings.stock_threshold} onChange={e => set("stock_threshold", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Template notificare</Label>
                <Input value={settings.stock_template} onChange={e => set("stock_template", e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">Variabile: {"{stock}"} {"{product}"}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Doar pe pagina produsului</Label>
                <Switch checked={settings.stock_product_page_only} onCheckedChange={v => set("stock_product_page_only", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 6: CUSTOM MESSAGES ═══ */}
        <TabsContent value="custom" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Mesaje Custom</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomMessages(prev => [...prev, {
                message_text: "", icon_type: "emoji", icon_value: "🎁", link_url: "",
                valid_from: "", valid_to: "", priority: 3, active: true, sort_order: prev.length,
              }])}><Plus className="w-3.5 h-3.5 mr-1" /> Adaugă mesaj</Button>
              <Button size="sm" onClick={saveCustomMessages} disabled={saving === "messages"}>
                {saving === "messages" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Salvează
              </Button>
            </div>
          </div>
          {customMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Niciun mesaj custom. Adaugă unul!</p>}
          {customMessages.map((msg, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs">Text mesaj (max 100 caractere)</Label>
                      <Textarea value={msg.message_text} onChange={e => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, message_text: e.target.value.slice(0, 100) } : m))} rows={2} />
                      <p className="text-[10px] text-muted-foreground">{msg.message_text.length}/100</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px]">Iconiță (emoji)</Label>
                        <Input value={msg.icon_value} onChange={e => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, icon_value: e.target.value } : m))} className="h-8 text-lg" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Link URL (opțional)</Label>
                        <Input value={msg.link_url} onChange={e => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, link_url: e.target.value } : m))} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">De la (dată)</Label>
                        <Input type="date" value={msg.valid_from} onChange={e => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, valid_from: e.target.value } : m))} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Până la (dată)</Label>
                        <Input type="date" value={msg.valid_to} onChange={e => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, valid_to: e.target.value } : m))} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px]">Prioritate</Label>
                        <div className="w-24">
                          <Slider value={[msg.priority]} min={1} max={5} step={1}
                            onValueChange={([v]) => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, priority: v } : m))} />
                        </div>
                        <span className="text-xs text-muted-foreground">{msg.priority}/5</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[10px]">Activ</Label>
                        <Switch checked={msg.active} onCheckedChange={v => setCustomMessages(prev => prev.map((m, idx) => idx === i ? { ...m, active: v } : m))} />
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCustomMessages(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ TAB 7: DESIGN ═══ */}
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Design & Personalizare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Background culoare</Label>
                  <div className="flex gap-1">
                    <Input type="color" value={settings.card_bg_color || "#ffffff"} onChange={e => set("card_bg_color", e.target.value)} className="w-10 h-8 p-0.5" />
                    <Input value={settings.card_bg_color} onChange={e => set("card_bg_color", e.target.value)} placeholder="auto" className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Text culoare</Label>
                  <div className="flex gap-1">
                    <Input type="color" value={settings.text_color || "#111111"} onChange={e => set("text_color", e.target.value)} className="w-10 h-8 p-0.5" />
                    <Input value={settings.text_color} onChange={e => set("text_color", e.target.value)} placeholder="auto" className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Accent (border)</Label>
                  <div className="flex gap-1">
                    <Input type="color" value={settings.accent_color || "#e5a341"} onChange={e => set("accent_color", e.target.value)} className="w-10 h-8 p-0.5" />
                    <Input value={settings.accent_color} onChange={e => set("accent_color", e.target.value)} placeholder="auto" className="h-8 text-xs" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Border radius (px)</Label>
                  <Input type="number" value={settings.border_radius_px} onChange={e => set("border_radius_px", +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Font size (px)</Label>
                  <Input type="number" value={settings.font_size_px} onChange={e => set("font_size_px", +e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Umbră intensitate (0-5)</Label>
                  <Slider value={[settings.shadow_intensity]} min={0} max={5} step={1}
                    onValueChange={([v]) => set("shadow_intensity", v)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Stil animație</Label>
                <Select value={settings.animation_style} onValueChange={v => set("animation_style", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slide-left">Slide din stânga</SelectItem>
                    <SelectItem value="fade">Fade simplu</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live preview */}
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Previzualizare live:</Label>
                <div className="relative h-24">
                  <div
                    className="absolute bottom-2 left-2 flex gap-3 items-center p-3 max-w-xs"
                    style={{
                      background: settings.card_bg_color || "hsl(var(--card))",
                      color: settings.text_color || "hsl(var(--card-foreground))",
                      borderRadius: `${settings.border_radius_px}px`,
                      borderLeft: `3px solid ${settings.accent_color || "hsl(var(--primary))"}`,
                      fontSize: `${settings.font_size_px}px`,
                      boxShadow: `0 ${settings.shadow_intensity * 2}px ${settings.shadow_intensity * 6}px rgba(0,0,0,${settings.shadow_intensity * 0.04})`,
                    }}
                  >
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-2xl shrink-0">🕯️</div>
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">Ana din Cluj</p>
                      <p className="opacity-70 text-xs truncate">a cumpărat Lumânare Vanilie</p>
                      <p className="text-xs mt-0.5" style={{ color: settings.accent_color || "hsl(var(--primary))" }}>⏰ acum 3 minute</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 8: STATS ═══ */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Statistici Social Proof</CardTitle></CardHeader>
            <CardContent>
              {!analytics || analytics.total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nu există date de analiză încă. Notificările vor genera statistici automat.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{analytics.total}</p>
                      <p className="text-xs text-muted-foreground">Total afișate</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{analytics.clicked}</p>
                      <p className="text-xs text-muted-foreground">Click-uri</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{analytics.total > 0 ? ((analytics.clicked / analytics.total) * 100).toFixed(1) : 0}%</p>
                      <p className="text-xs text-muted-foreground">Rată click</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{analytics.dismissed}</p>
                      <p className="text-xs text-muted-foreground">Închise (×)</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Per tip notificare</h4>
                    <div className="space-y-1">
                      {Object.entries(analytics.byType).map(([type, count]: any) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
