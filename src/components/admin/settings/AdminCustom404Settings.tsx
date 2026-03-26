import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, RotateCcw, Trash2, Plus, Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface ButtonConfig {
  label: string;
  url: string;
  style: string;
  color: string;
}

interface Settings404 {
  id: string;
  enabled: boolean;
  image_url: string | null;
  image_alignment: string;
  image_max_width: string;
  title_text: string;
  title_font_size: number;
  title_color: string;
  title_bold: boolean;
  subtitle_text: string;
  subtitle_font_size: number;
  subtitle_color: string;
  buttons: ButtonConfig[];
  show_recommended_products: boolean;
  recommended_section_title: string;
  recommended_count: number;
  recommended_source: string;
  recommended_product_ids: string[] | null;
  recommended_show_price: boolean;
  recommended_show_add_to_cart: boolean;
  show_search: boolean;
  search_placeholder: string;
  show_categories: boolean;
  categories_title: string;
  category_ids: string[] | null;
  background_color: string | null;
  background_image_url: string | null;
  meta_title: string;
}

interface LogStat {
  url_accessed: string;
  visit_count: number;
  first_seen: string;
  last_seen: string;
  referrer_count: number;
}

const DEFAULTS: Omit<Settings404, "id"> = {
  enabled: false,
  image_url: null,
  image_alignment: "center",
  image_max_width: "400px",
  title_text: "Oops! Pagina nu a fost găsită",
  title_font_size: 32,
  title_color: "#1a1a1a",
  title_bold: true,
  subtitle_text: "Ne pare rău, pagina pe care o cauți nu există sau a fost mutată. Dar nu îngrijora — mai ai multe de explorat în magazinul nostru!",
  subtitle_font_size: 16,
  subtitle_color: "#666666",
  buttons: [
    { label: "Înapoi acasă", url: "/", style: "default", color: "" },
    { label: "Vezi toate produsele", url: "/catalog", style: "outline", color: "" },
  ],
  show_recommended_products: false,
  recommended_section_title: "S-ar putea să-ți placă",
  recommended_count: 4,
  recommended_source: "featured",
  recommended_product_ids: null,
  recommended_show_price: true,
  recommended_show_add_to_cart: true,
  show_search: true,
  search_placeholder: "Caută produse în magazin...",
  show_categories: false,
  categories_title: "Explorează categoriile noastre",
  category_ids: null,
  background_color: null,
  background_image_url: null,
  meta_title: "Pagina nu a fost găsită",
};

export default function AdminCustom404Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings404 | null>(null);
  const [stats, setStats] = useState<LogStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from("custom_404_settings").select("*").limit(1).single();
    if (data) {
      setSettings({
        ...data,
        buttons: Array.isArray(data.buttons) ? data.buttons as unknown as ButtonConfig[] : JSON.parse(data.buttons as string),
        recommended_product_ids: data.recommended_product_ids as string[] | null,
        category_ids: data.category_ids as string[] | null,
      });
    }
    setLoading(false);
  }

  async function loadStats() {
    setStatsLoading(true);
    const { data } = await supabase.from("custom_404_stats" as any).select("*").limit(200);
    setStats((data as any) || []);
    setStatsLoading(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase.from("custom_404_settings").update({ ...rest, updated_at: new Date().toISOString() } as any).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Eroare la salvare", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Setări salvate ✓" });
    }
  }

  function handleReset() {
    if (!settings) return;
    if (!confirm("Resetezi toate setările la valorile implicite?")) return;
    setSettings({ ...DEFAULTS, id: settings.id });
  }

  function updateButton(idx: number, field: keyof ButtonConfig, value: string) {
    if (!settings) return;
    const btns = [...settings.buttons];
    btns[idx] = { ...btns[idx], [field]: value };
    setSettings({ ...settings, buttons: btns });
  }

  function addButton() {
    if (!settings || settings.buttons.length >= 3) return;
    setSettings({ ...settings, buttons: [...settings.buttons, { label: "Buton nou", url: "/", style: "outline", color: "" }] });
  }

  function removeButton(idx: number) {
    if (!settings || settings.buttons.length <= 1) return;
    setSettings({ ...settings, buttons: settings.buttons.filter((_, i) => i !== idx) });
  }

  async function exportCsv() {
    const { data } = await supabase.from("custom_404_stats" as any).select("*").limit(1000);
    if (!data || !data.length) return;
    const rows = data as LogStat[];
    const csv = ["URL,Vizite,Prima accesare,Ultima accesare,Referreri unici"]
      .concat(rows.map(r => `"${r.url_accessed}",${r.visit_count},${r.first_seen},${r.last_seen},${r.referrer_count}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "raport-404.csv";
    a.click();
  }

  if (loading || !settings) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagină 404 Custom</h1>
          <p className="text-sm text-muted-foreground">Personalizează pagina afișată vizitatorilor când accesează un URL inexistent.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="w-4 h-4 mr-1" />Previzualizare</Button>
          <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-1" />Resetează</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Salvare..." : "Salvează"}</Button>
        </div>
      </div>

      <Tabs defaultValue="editor" onValueChange={(v) => v === "report" && loadStats()}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="report">Raport 404</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Global toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Activare pagină 404 custom</CardTitle>
                  <CardDescription>Când este activat, pagina 404 va folosi tema magazinului și conținutul personalizat.</CardDescription>
                </div>
                <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
              </div>
            </CardHeader>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagine principală</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>URL imagine</Label>
                <Input value={settings.image_url || ""} onChange={(e) => setSettings({ ...settings, image_url: e.target.value || null })} placeholder="https://... sau gol pentru ilustrația implicită" />
              </div>
              <div className="flex gap-4">
                <div>
                  <Label>Aliniere</Label>
                  <Select value={settings.image_alignment} onValueChange={(v) => setSettings({ ...settings, image_alignment: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Stânga</SelectItem>
                      <SelectItem value="center">Centru</SelectItem>
                      <SelectItem value="right">Dreapta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lățime maximă</Label>
                  <Input value={settings.image_max_width} onChange={(e) => setSettings({ ...settings, image_max_width: e.target.value })} placeholder="400px" className="w-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Titlu principal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={settings.title_text} onChange={(e) => setSettings({ ...settings, title_text: e.target.value })} maxLength={100} />
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Dimensiune font (px)</Label>
                  <Input type="number" value={settings.title_font_size} onChange={(e) => setSettings({ ...settings, title_font_size: parseInt(e.target.value) || 32 })} className="w-24" />
                </div>
                <div>
                  <Label>Culoare</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.title_color} onChange={(e) => setSettings({ ...settings, title_color: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                    <Input value={settings.title_color} onChange={(e) => setSettings({ ...settings, title_color: e.target.value })} className="w-28" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={settings.title_bold} onCheckedChange={(v) => setSettings({ ...settings, title_bold: v })} />
                  <Label>Bold</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtitle */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Subtitlu / Mesaj</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={settings.subtitle_text} onChange={(e) => setSettings({ ...settings, subtitle_text: e.target.value })} maxLength={300} rows={3} />
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Dimensiune font (px)</Label>
                  <Input type="number" value={settings.subtitle_font_size} onChange={(e) => setSettings({ ...settings, subtitle_font_size: parseInt(e.target.value) || 16 })} className="w-24" />
                </div>
                <div>
                  <Label>Culoare</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.subtitle_color} onChange={(e) => setSettings({ ...settings, subtitle_color: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                    <Input value={settings.subtitle_color} onChange={(e) => setSettings({ ...settings, subtitle_color: e.target.value })} className="w-28" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Butoane de acțiune</CardTitle>
                {settings.buttons.length < 3 && (
                  <Button variant="outline" size="sm" onClick={addButton}><Plus className="w-3 h-3 mr-1" />Adaugă buton</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.buttons.map((btn, i) => (
                <div key={i} className="flex gap-2 items-end border rounded-md p-3 bg-muted/30">
                  <div className="flex-1">
                    <Label>Label</Label>
                    <Input value={btn.label} onChange={(e) => updateButton(i, "label", e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>URL</Label>
                    <Input value={btn.url} onChange={(e) => updateButton(i, "url", e.target.value)} />
                  </div>
                  <div>
                    <Label>Stil</Label>
                    <Select value={btn.style} onValueChange={(v) => updateButton(i, "style", v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {settings.buttons.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeButton(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Secțiune căutare</CardTitle>
                <Switch checked={settings.show_search} onCheckedChange={(v) => setSettings({ ...settings, show_search: v })} />
              </div>
            </CardHeader>
            {settings.show_search && (
              <CardContent>
                <Label>Placeholder</Label>
                <Input value={settings.search_placeholder} onChange={(e) => setSettings({ ...settings, search_placeholder: e.target.value })} />
              </CardContent>
            )}
          </Card>

          {/* Recommended products */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Produse recomandate</CardTitle>
                <Switch checked={settings.show_recommended_products} onCheckedChange={(v) => setSettings({ ...settings, show_recommended_products: v })} />
              </div>
            </CardHeader>
            {settings.show_recommended_products && (
              <CardContent className="space-y-3">
                <div>
                  <Label>Titlu secțiune</Label>
                  <Input value={settings.recommended_section_title} onChange={(e) => setSettings({ ...settings, recommended_section_title: e.target.value })} />
                </div>
                <div className="flex gap-4">
                  <div>
                    <Label>Număr produse</Label>
                    <Select value={String(settings.recommended_count)} onValueChange={(v) => setSettings({ ...settings, recommended_count: parseInt(v) })}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sursă</Label>
                    <Select value={settings.recommended_source} onValueChange={(v) => setSettings({ ...settings, recommended_source: v })}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Produse featured</SelectItem>
                        <SelectItem value="best_selling">Cele mai vândute</SelectItem>
                        <SelectItem value="manual">Selecție manuală</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={settings.recommended_show_price} onCheckedChange={(v) => setSettings({ ...settings, recommended_show_price: v })} />
                    <Label>Afișează preț</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={settings.recommended_show_add_to_cart} onCheckedChange={(v) => setSettings({ ...settings, recommended_show_add_to_cart: v })} />
                    <Label>Buton Adaugă în coș</Label>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Categorii rapide</CardTitle>
                <Switch checked={settings.show_categories} onCheckedChange={(v) => setSettings({ ...settings, show_categories: v })} />
              </div>
            </CardHeader>
            {settings.show_categories && (
              <CardContent>
                <Label>Titlu secțiune</Label>
                <Input value={settings.categories_title} onChange={(e) => setSettings({ ...settings, categories_title: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Se vor afișa automat primele 8 categorii principale.</p>
              </CardContent>
            )}
          </Card>

          {/* Background */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Background</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Culoare fundal</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={settings.background_color || "#ffffff"} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                  <Input value={settings.background_color || ""} onChange={(e) => setSettings({ ...settings, background_color: e.target.value || null })} placeholder="Gol = tema implicită" className="w-40" />
                </div>
              </div>
              <div>
                <Label>URL imagine fundal</Label>
                <Input value={settings.background_image_url || ""} onChange={(e) => setSettings({ ...settings, background_image_url: e.target.value || null })} placeholder="Opțional" />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>Meta title</Label>
                <Input value={settings.meta_title} onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">Meta robots: noindex, nofollow (fix — paginile 404 nu trebuie indexate)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report tab */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Raport URL-uri 404</CardTitle>
                  <CardDescription>URL-uri accesate care nu există — ajută la identificarea link-urilor rupte.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
              ) : stats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nu există date încă.</p>
              ) : (
                <div className="overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL accesat</TableHead>
                        <TableHead className="text-right">Vizite</TableHead>
                        <TableHead>Prima accesare</TableHead>
                        <TableHead>Ultima accesare</TableHead>
                        <TableHead className="text-right">Referreri</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs max-w-[300px] truncate">{s.url_accessed}</TableCell>
                          <TableCell className="text-right"><Badge variant="secondary">{s.visit_count}</Badge></TableCell>
                          <TableCell className="text-xs">{s.first_seen ? format(new Date(s.first_seen), "dd.MM.yyyy HH:mm") : "-"}</TableCell>
                          <TableCell className="text-xs">{s.last_seen ? format(new Date(s.last_seen), "dd.MM.yyyy HH:mm") : "-"}</TableCell>
                          <TableCell className="text-right">{s.referrer_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare pagină 404</DialogTitle></DialogHeader>
          <div
            className="rounded-lg border p-8"
            style={{
              backgroundColor: settings.background_color || undefined,
              backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="max-w-lg mx-auto text-center space-y-6">
              {settings.image_url && (
                <div style={{ textAlign: settings.image_alignment as any }}>
                  <img src={settings.image_url} alt="404" style={{ maxWidth: settings.image_max_width, display: "inline-block" }} className="rounded" />
                </div>
              )}
              <h1 style={{ fontSize: settings.title_font_size, color: settings.title_color, fontWeight: settings.title_bold ? 700 : 400 }}>
                {settings.title_text}
              </h1>
              <p style={{ fontSize: settings.subtitle_font_size, color: settings.subtitle_color }}>
                {settings.subtitle_text}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {settings.buttons.map((btn, i) => (
                  <Button key={i} variant={btn.style as any || "default"} size="lg">{btn.label}</Button>
                ))}
              </div>
              {settings.show_search && (
                <div className="max-w-sm mx-auto">
                  <Input placeholder={settings.search_placeholder} className="text-center" readOnly />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
