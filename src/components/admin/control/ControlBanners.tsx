import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2, Megaphone, PanelTop, SidebarOpen, Maximize2, Bell, LayoutList } from "lucide-react";
import { toast } from "sonner";

interface BannerRow {
  id: string;
  banner_type: string;
  title: string;
  content: string;
  settings_json: Record<string, any>;
  is_active: boolean;
  scheduled_from: string | null;
  scheduled_until: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const BANNER_TYPES = [
  { value: "announcement", label: "🔔 Bară Anunț (Ticker)", icon: Megaphone },
  { value: "sticky", label: "📌 Banner Sticky", icon: PanelTop },
  { value: "floating", label: "📎 Banner Lateral", icon: SidebarOpen },
  { value: "modal", label: "🪟 Popup Modal", icon: Maximize2 },
  { value: "corner", label: "🔔 Notificare Colț", icon: Bell },
  { value: "inline", label: "📋 Banner Inline", icon: LayoutList },
];

const DEFAULT_SETTINGS: Record<string, Record<string, any>> = {
  announcement: { scroll_speed: "medium", separator: "·", bg_color: "#1a1a2e", text_color: "#ffffff", font_size: 14, font_weight: "normal", show_close: true, messages: [""] },
  sticky: { icon: "info", bg_color: "#f0f9ff", text_color: "#1e3a5f", cta_text: "", cta_url: "", dismissible: true, position: "below_header" },
  floating: { position: "right", vertical: "center", width: 300, content_type: "text", animation: "slide-in", auto_close: 0, show_after_scroll: 0, image_url: "", cta_text: "", cta_url: "" },
  modal: { trigger: "page_load", delay_seconds: 3, size: "medium", image_url: "", cta_text: "", cta_url: "", overlay: true, overlay_opacity: 50, show_frequency: "once_per_session", scroll_percent: 50 },
  corner: { position: "bottom-right", icon: "info", auto_dismiss: 5, stack: false },
  inline: { insert_after: "hero", full_width: true, bg_type: "solid", bg_color: "#f5f5f5", bg_gradient: "", image_url: "", cta_text: "", cta_url: "" },
};

export default function ControlBanners() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("announcement");

  const fetchBanners = async () => {
    const { data } = await (supabase as any)
      .from("site_banners")
      .select("*")
      .order("sort_order, created_at");
    if (data) setBanners(data);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const addBanner = async (type: string) => {
    const { data } = await (supabase as any)
      .from("site_banners")
      .insert({
        banner_type: type,
        title: `Banner ${type} nou`,
        content: "",
        settings_json: DEFAULT_SETTINGS[type] || {},
        is_active: false,
        sort_order: banners.filter((b) => b.banner_type === type).length,
      })
      .select()
      .single();
    if (data) {
      setBanners([...banners, data]);
      toast.success("Banner creat!");
    }
  };

  const updateBanner = async (banner: BannerRow) => {
    setSaving(banner.id);
    await (supabase as any)
      .from("site_banners")
      .update({
        title: banner.title,
        content: banner.content,
        settings_json: banner.settings_json,
        is_active: banner.is_active,
        scheduled_from: banner.scheduled_from,
        scheduled_until: banner.scheduled_until,
        updated_at: new Date().toISOString(),
      })
      .eq("id", banner.id);
    toast.success("Banner salvat!");
    setSaving(null);
  };

  const deleteBanner = async (id: string) => {
    await (supabase as any).from("site_banners").delete().eq("id", id);
    setBanners(banners.filter((b) => b.id !== id));
    toast.success("Banner șters!");
  };

  const updateLocal = (id: string, updates: Partial<BannerRow>) => {
    setBanners(banners.map((b) => b.id === id ? { ...b, ...updates } : b));
  };

  const updateSettings = (id: string, key: string, value: any) => {
    setBanners(banners.map((b) => {
      if (b.id !== id) return b;
      return { ...b, settings_json: { ...b.settings_json, [key]: value } };
    }));
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  const typeBanners = banners.filter((b) => b.banner_type === activeType);

  return (
    <div className="space-y-4">
      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {BANNER_TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
              {banners.filter((b) => b.banner_type === t.value && b.is_active).length > 0 && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {BANNER_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{banners.filter((b) => b.banner_type === type.value).length} bannere</p>
              <Button size="sm" onClick={() => addBanner(type.value)}><Plus className="w-4 h-4 mr-1" /> Adaugă {type.label.split(" ").slice(1).join(" ")}</Button>
            </div>

            {banners.filter((b) => b.banner_type === type.value).map((banner) => (
              <Card key={banner.id} className={`border-border ${banner.is_active ? "bg-card" : "bg-muted/30"}`}>
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch checked={banner.is_active} onCheckedChange={(v) => updateLocal(banner.id, { is_active: v })} />
                    <Input
                      value={banner.title}
                      onChange={(e) => updateLocal(banner.id, { title: e.target.value })}
                      className="max-w-xs font-medium"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => updateBanner(banner)} disabled={saving === banner.id}>
                      {saving === banner.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteBanner(banner.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <Label>Conținut / Mesaj</Label>
                    <Textarea value={banner.content} onChange={(e) => updateLocal(banner.id, { content: e.target.value })} rows={2} />
                  </div>

                  {/* Schedule */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Programat de la</Label>
                      <Input type="datetime-local" value={banner.scheduled_from?.slice(0, 16) || ""} onChange={(e) => updateLocal(banner.id, { scheduled_from: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                    <div>
                      <Label>Programat până la</Label>
                      <Input type="datetime-local" value={banner.scheduled_until?.slice(0, 16) || ""} onChange={(e) => updateLocal(banner.id, { scheduled_until: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                  </div>

                  {/* Type-specific settings */}
                  {banner.banner_type === "announcement" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Viteză scroll</Label>
                          <Select value={banner.settings_json.scroll_speed || "medium"} onValueChange={(v) => updateSettings(banner.id, "scroll_speed", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">Lent</SelectItem>
                              <SelectItem value="medium">Mediu</SelectItem>
                              <SelectItem value="fast">Rapid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Separator</Label>
                          <Select value={banner.settings_json.separator || "·"} onValueChange={(v) => updateSettings(banner.id, "separator", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="·">·</SelectItem>
                              <SelectItem value="|">|</SelectItem>
                              <SelectItem value="★">★</SelectItem>
                              <SelectItem value="•">•</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Buton închidere</Label>
                          <Switch checked={banner.settings_json.show_close !== false} onCheckedChange={(v) => updateSettings(banner.id, "show_close", v)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Culoare fundal</Label>
                          <div className="flex gap-2">
                            <input type="color" value={banner.settings_json.bg_color || "#1a1a2e"} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                            <Input value={banner.settings_json.bg_color || "#1a1a2e"} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="flex-1 text-xs" />
                          </div>
                        </div>
                        <div>
                          <Label>Culoare text</Label>
                          <div className="flex gap-2">
                            <input type="color" value={banner.settings_json.text_color || "#ffffff"} onChange={(e) => updateSettings(banner.id, "text_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                            <Input value={banner.settings_json.text_color || "#ffffff"} onChange={(e) => updateSettings(banner.id, "text_color", e.target.value)} className="flex-1 text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {banner.banner_type === "sticky" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Icon</Label>
                          <Select value={banner.settings_json.icon || "info"} onValueChange={(v) => updateSettings(banner.id, "icon", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">ℹ️ Info</SelectItem>
                              <SelectItem value="warning">⚠️ Avertisment</SelectItem>
                              <SelectItem value="success">✅ Succes</SelectItem>
                              <SelectItem value="promo">🎉 Promoție</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Poziție</Label>
                          <Select value={banner.settings_json.position || "below_header"} onValueChange={(v) => updateSettings(banner.id, "position", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="above_header">Deasupra header</SelectItem>
                              <SelectItem value="below_header">Sub header</SelectItem>
                              <SelectItem value="above_footer">Deasupra footer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Dismissibil</Label>
                          <Switch checked={banner.settings_json.dismissible !== false} onCheckedChange={(v) => updateSettings(banner.id, "dismissible", v)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Text CTA</Label><Input value={banner.settings_json.cta_text || ""} onChange={(e) => updateSettings(banner.id, "cta_text", e.target.value)} /></div>
                        <div><Label>URL CTA</Label><Input value={banner.settings_json.cta_url || ""} onChange={(e) => updateSettings(banner.id, "cta_url", e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Culoare fundal</Label><div className="flex gap-2"><input type="color" value={banner.settings_json.bg_color || "#f0f9ff"} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" /><Input value={banner.settings_json.bg_color || ""} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="flex-1 text-xs" /></div></div>
                        <div><Label>Culoare text</Label><div className="flex gap-2"><input type="color" value={banner.settings_json.text_color || "#1e3a5f"} onChange={(e) => updateSettings(banner.id, "text_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" /><Input value={banner.settings_json.text_color || ""} onChange={(e) => updateSettings(banner.id, "text_color", e.target.value)} className="flex-1 text-xs" /></div></div>
                      </div>
                    </div>
                  )}

                  {banner.banner_type === "floating" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Poziție</Label>
                          <Select value={banner.settings_json.position || "right"} onValueChange={(v) => updateSettings(banner.id, "position", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="left">Stânga</SelectItem><SelectItem value="right">Dreapta</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Aliniere verticală</Label>
                          <Select value={banner.settings_json.vertical || "center"} onValueChange={(v) => updateSettings(banner.id, "vertical", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="top">Sus</SelectItem><SelectItem value="center">Centru</SelectItem><SelectItem value="bottom">Jos</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Animație</Label>
                          <Select value={banner.settings_json.animation || "slide-in"} onValueChange={(v) => updateSettings(banner.id, "animation", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="slide-in">Slide</SelectItem><SelectItem value="fade-in">Fade</SelectItem><SelectItem value="bounce">Bounce</SelectItem><SelectItem value="none">Fără</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Lățime: {banner.settings_json.width || 300}px</Label><Slider value={[banner.settings_json.width || 300]} onValueChange={([v]) => updateSettings(banner.id, "width", v)} min={200} max={400} step={10} /></div>
                        <div><Label>Auto-închidere: {banner.settings_json.auto_close || 0}s (0=rămâne)</Label><Slider value={[banner.settings_json.auto_close || 0]} onValueChange={([v]) => updateSettings(banner.id, "auto_close", v)} min={0} max={30} step={1} /></div>
                      </div>
                      <div><Label>Apare după scroll: {banner.settings_json.show_after_scroll || 0}%</Label><Slider value={[banner.settings_json.show_after_scroll || 0]} onValueChange={([v]) => updateSettings(banner.id, "show_after_scroll", v)} min={0} max={80} step={5} /></div>
                    </div>
                  )}

                  {banner.banner_type === "modal" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Trigger</Label>
                          <Select value={banner.settings_json.trigger || "page_load"} onValueChange={(v) => updateSettings(banner.id, "trigger", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="page_load">La încărcare</SelectItem>
                              <SelectItem value="delay">După N secunde</SelectItem>
                              <SelectItem value="exit_intent">Exit intent</SelectItem>
                              <SelectItem value="scroll">După scroll %</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Dimensiune</Label>
                          <Select value={banner.settings_json.size || "medium"} onValueChange={(v) => updateSettings(banner.id, "size", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="small">Mic</SelectItem><SelectItem value="medium">Mediu</SelectItem><SelectItem value="large">Mare</SelectItem><SelectItem value="fullscreen">Fullscreen</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Frecvență</Label>
                          <Select value={banner.settings_json.show_frequency || "once_per_session"} onValueChange={(v) => updateSettings(banner.id, "show_frequency", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="once_per_session">O dată/sesiune</SelectItem><SelectItem value="once_per_day">O dată/zi</SelectItem><SelectItem value="always">Mereu</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Delay (secunde)</Label><Input type="number" value={banner.settings_json.delay_seconds || 3} onChange={(e) => updateSettings(banner.id, "delay_seconds", parseInt(e.target.value))} /></div>
                        <div><Label>Overlay opacitate: {banner.settings_json.overlay_opacity || 50}%</Label><Slider value={[banner.settings_json.overlay_opacity || 50]} onValueChange={([v]) => updateSettings(banner.id, "overlay_opacity", v)} min={0} max={100} step={5} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Text CTA</Label><Input value={banner.settings_json.cta_text || ""} onChange={(e) => updateSettings(banner.id, "cta_text", e.target.value)} /></div>
                        <div><Label>URL CTA</Label><Input value={banner.settings_json.cta_url || ""} onChange={(e) => updateSettings(banner.id, "cta_url", e.target.value)} /></div>
                      </div>
                    </div>
                  )}

                  {banner.banner_type === "corner" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Poziție</Label>
                          <Select value={banner.settings_json.position || "bottom-right"} onValueChange={(v) => updateSettings(banner.id, "position", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="top-left">Sus-Stânga</SelectItem><SelectItem value="top-right">Sus-Dreapta</SelectItem><SelectItem value="bottom-left">Jos-Stânga</SelectItem><SelectItem value="bottom-right">Jos-Dreapta</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div><Label>Auto-dismiss: {banner.settings_json.auto_dismiss || 5}s</Label><Slider value={[banner.settings_json.auto_dismiss || 5]} onValueChange={([v]) => updateSettings(banner.id, "auto_dismiss", v)} min={1} max={30} step={1} /></div>
                        <div><Label>Stivuire</Label><Switch checked={banner.settings_json.stack === true} onCheckedChange={(v) => updateSettings(banner.id, "stack", v)} /></div>
                      </div>
                    </div>
                  )}

                  {banner.banner_type === "inline" && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Inserează după</Label>
                          <Select value={banner.settings_json.insert_after || "hero"} onValueChange={(v) => updateSettings(banner.id, "insert_after", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hero">După Hero</SelectItem>
                              <SelectItem value="section_1">După Secțiunea 1</SelectItem>
                              <SelectItem value="section_2">După Secțiunea 2</SelectItem>
                              <SelectItem value="before_footer">Înainte de Footer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Full width</Label><Switch checked={banner.settings_json.full_width !== false} onCheckedChange={(v) => updateSettings(banner.id, "full_width", v)} /></div>
                        <div>
                          <Label>Tip fundal</Label>
                          <Select value={banner.settings_json.bg_type || "solid"} onValueChange={(v) => updateSettings(banner.id, "bg_type", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="solid">Solid</SelectItem><SelectItem value="gradient">Gradient</SelectItem><SelectItem value="image">Imagine</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Culoare fundal</Label><div className="flex gap-2"><input type="color" value={banner.settings_json.bg_color || "#f5f5f5"} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" /><Input value={banner.settings_json.bg_color || ""} onChange={(e) => updateSettings(banner.id, "bg_color", e.target.value)} className="flex-1 text-xs" /></div></div>
                        <div><Label>Text CTA</Label><Input value={banner.settings_json.cta_text || ""} onChange={(e) => updateSettings(banner.id, "cta_text", e.target.value)} /></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {banners.filter((b) => b.banner_type === type.value).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Niciun banner de acest tip. Apasă "Adaugă" pentru a crea unul.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
