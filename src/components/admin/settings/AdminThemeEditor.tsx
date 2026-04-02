import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Eye, RotateCcw, Paintbrush, Type, Square, Layout, Code } from "lucide-react";
// Local ThemeSettings type for the advanced admin editor (writes to app_settings)
interface ThemeSettings {
  colors: {
    primary: string; primaryForeground: string; secondary: string; secondaryForeground: string;
    background: string; foreground: string; card: string; muted: string; mutedForeground: string;
    accent: string; accentForeground: string; destructive: string; border: string;
  };
  typography: {
    fontFamily: string; fontFamilyHeadings: string; baseFontSize: number;
    h1Size: number; h2Size: number; h3Size: number;
    h1Weight: string; h2Weight: string; h3Weight: string;
    bodyWeight: string; lineHeight: number;
  };
  buttons: {
    borderRadius: number; paddingX: number; paddingY: number; fontWeight: string;
    textTransform: "none" | "uppercase" | "capitalize"; hoverEffect: "darken" | "lighten" | "shadow" | "scale";
  };
  layout: {
    containerMaxWidth: number; sectionSpacing: number; cardBorderRadius: number;
    headerStyle: "gradient" | "solid" | "transparent";
  };
  customCss: string;
  isPublished: boolean;
}

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Nunito", "Raleway",
  "Playfair Display", "Merriweather", "Source Sans 3", "DM Sans", "Outfit", "Manrope",
];

const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: "#e87722",
    primaryForeground: "#ffffff",
    secondary: "#1e3a5f",
    secondaryForeground: "#ffffff",
    background: "#f5f7fa",
    foreground: "#1a2332",
    card: "#ffffff",
    muted: "#ebeef2",
    mutedForeground: "#6b7a8d",
    accent: "#e87722",
    accentForeground: "#ffffff",
    destructive: "#e53e3e",
    border: "#dce1e8",
  },
  typography: {
    fontFamily: "Inter",
    fontFamilyHeadings: "Inter",
    baseFontSize: 16,
    h1Size: 36,
    h2Size: 28,
    h3Size: 22,
    h1Weight: "800",
    h2Weight: "700",
    h3Weight: "600",
    bodyWeight: "400",
    lineHeight: 1.6,
  },
  buttons: {
    borderRadius: 8,
    paddingX: 24,
    paddingY: 12,
    fontWeight: "600",
    textTransform: "none" as "none" | "uppercase" | "capitalize",
    hoverEffect: "darken" as "darken" | "lighten" | "shadow" | "scale",
  },
  layout: {
    containerMaxWidth: 1280,
    sectionSpacing: 40,
    cardBorderRadius: 12,
    headerStyle: "gradient" as "gradient" | "solid" | "transparent",
  },
  customCss: "",
  isPublished: true,
};

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer" style={{ padding: 0 }} />
      </div>
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs font-mono" />
      </div>
    </div>
  );
}

export default function AdminThemeEditor() {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [savedTheme, setSavedTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "theme_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) {
        const loaded = { ...DEFAULT_THEME, ...(data.value_json as unknown as ThemeSettings) };
        setTheme(loaded);
        setSavedTheme(loaded);
      }
      setLoading(false);
    });
  }, []);

  const setColor = (key: string, val: string) => setTheme(t => ({ ...t, colors: { ...t.colors, [key]: val } }));
  const setTypo = (key: string, val: any) => setTheme(t => ({ ...t, typography: { ...t.typography, [key]: val } }));
  const setBtn = (key: string, val: any) => setTheme(t => ({ ...t, buttons: { ...t.buttons, [key]: val } }));
  const setLay = (key: string, val: any) => setTheme(t => ({ ...t, layout: { ...t.layout, [key]: val } }));

  const save = async (publish: boolean) => {
    setSaving(true);
    const payload = { ...theme, isPublished: publish };
    const { error } = await supabase.from("app_settings").upsert(
      { key: "theme_settings", value_json: payload as any, description: "Theme customization settings" },
      { onConflict: "key" }
    );
    if (error) { toast.error(error.message); }
    else {
      toast.success(publish ? "Tema publicată!" : "Draft salvat (nepublicat)");
      setSavedTheme(payload);
      setTheme(payload);
    }
    setSaving(false);
  };

  const reset = () => { setTheme(DEFAULT_THEME); toast.info("Resetat la valorile implicite (nesalvat)"); };

  const generatePreviewCss = useCallback(() => {
    const c = theme.colors;
    const t = theme.typography;
    const b = theme.buttons;
    const l = theme.layout;
    return `:root {
  --background: ${hexToHsl(c.background)};
  --foreground: ${hexToHsl(c.foreground)};
  --card: ${hexToHsl(c.card)};
  --card-foreground: ${hexToHsl(c.foreground)};
  --primary: ${hexToHsl(c.primary)};
  --primary-foreground: ${hexToHsl(c.primaryForeground)};
  --secondary: ${hexToHsl(c.secondary)};
  --secondary-foreground: ${hexToHsl(c.secondaryForeground)};
  --muted: ${hexToHsl(c.muted)};
  --muted-foreground: ${hexToHsl(c.mutedForeground)};
  --accent: ${hexToHsl(c.accent)};
  --accent-foreground: ${hexToHsl(c.accentForeground)};
  --destructive: ${hexToHsl(c.destructive)};
  --border: ${hexToHsl(c.border)};
  --input: ${hexToHsl(c.border)};
  --ring: ${hexToHsl(c.primary)};
  --radius: ${b.borderRadius / 16}rem;
}
body { font-family: '${t.fontFamily}', system-ui, sans-serif; font-size: ${t.baseFontSize}px; line-height: ${t.lineHeight}; }
h1, h2, h3, h4, h5, h6 { font-family: '${t.fontFamilyHeadings}', system-ui, sans-serif; }
h1 { font-size: ${t.h1Size}px; font-weight: ${t.h1Weight}; }
h2 { font-size: ${t.h2Size}px; font-weight: ${t.h2Weight}; }
h3 { font-size: ${t.h3Size}px; font-weight: ${t.h3Weight}; }
.container { max-width: ${l.containerMaxWidth}px; }
${theme.customCss || ""}`;
  }, [theme]);

  const openPreview = () => {
    const css = generatePreviewCss();
    const fonts = [theme.typography.fontFamily, theme.typography.fontFamilyHeadings]
      .filter((f, i, a) => a.indexOf(f) === i).map(f => f.replace(/ /g, "+")).join("&family=");
    const previewUrl = `${window.location.origin}/?_themePreview=1`;
    const w = window.open(previewUrl, "_themePreview");
    if (w) {
      setTimeout(() => {
        try {
          const link = w.document.createElement("link");
          link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@400;500;600;700;800&display=swap`;
          link.rel = "stylesheet";
          w.document.head.appendChild(link);
          const style = w.document.createElement("style");
          style.id = "theme-preview-override";
          style.textContent = css;
          w.document.head.appendChild(style);
        } catch { /* cross-origin fallback */ }
      }, 2000);
    }
    setPreviewOpen(true);
  };

  if (loading) return <Card><CardContent className="py-12 text-center text-muted-foreground">Se încarcă setările temei...</CardContent></Card>;

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(savedTheme);

  // Lazy load extended sections
  const AdminThemeEditorExtended = lazy(() => import("./AdminThemeEditorExtended"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personalizare Temă</h1>
          <p className="text-sm text-muted-foreground">Modifică designul magazinului fără a scrie cod</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Resetează</Button>
          <Button variant="outline" size="sm" onClick={openPreview}><Eye className="h-4 w-4 mr-1" /> Previzualizează</Button>
          <Button variant="secondary" size="sm" onClick={() => save(false)} disabled={saving}>Salvează Draft</Button>
          <Button size="sm" onClick={() => save(true)} disabled={saving}><Save className="h-4 w-4 mr-1" /> Publică</Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-accent/10 border border-accent/30 text-accent-foreground text-sm px-4 py-2 rounded-lg">
          ⚠️ Ai modificări nesalvate. Apasă „Publică" pentru a le aplica live.
        </div>
      )}

      <Tabs defaultValue="colors">
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="colors"><Paintbrush className="h-4 w-4 mr-1" /> Culori</TabsTrigger>
          <TabsTrigger value="typography"><Type className="h-4 w-4 mr-1" /> Tipografie</TabsTrigger>
          <TabsTrigger value="buttons"><Square className="h-4 w-4 mr-1" /> Butoane</TabsTrigger>
          <TabsTrigger value="layout"><Layout className="h-4 w-4 mr-1" /> Layout</TabsTrigger>
          <TabsTrigger value="css"><Code className="h-4 w-4 mr-1" /> CSS</TabsTrigger>
        </TabsList>

        {/* ══════ CULORI ══════ */}
        <TabsContent value="colors">
          <Card>
            <CardHeader><CardTitle className="text-lg">Culori</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Primară (butoane, accente)" value={theme.colors.primary} onChange={v => setColor("primary", v)} />
                <ColorField label="Primară Text" value={theme.colors.primaryForeground} onChange={v => setColor("primaryForeground", v)} />
                <ColorField label="Secundară (header, sidebar)" value={theme.colors.secondary} onChange={v => setColor("secondary", v)} />
                <ColorField label="Secundară Text" value={theme.colors.secondaryForeground} onChange={v => setColor("secondaryForeground", v)} />
                <ColorField label="Fundal pagină" value={theme.colors.background} onChange={v => setColor("background", v)} />
                <ColorField label="Text principal" value={theme.colors.foreground} onChange={v => setColor("foreground", v)} />
                <ColorField label="Card / panou" value={theme.colors.card} onChange={v => setColor("card", v)} />
                <ColorField label="Muted (fundal secundar)" value={theme.colors.muted} onChange={v => setColor("muted", v)} />
                <ColorField label="Text secundar" value={theme.colors.mutedForeground} onChange={v => setColor("mutedForeground", v)} />
                <ColorField label="Accent" value={theme.colors.accent} onChange={v => setColor("accent", v)} />
                <ColorField label="Eroare / Destructiv" value={theme.colors.destructive} onChange={v => setColor("destructive", v)} />
                <ColorField label="Borduri" value={theme.colors.border} onChange={v => setColor("border", v)} />
              </div>
              <Separator className="my-6" />
              <h3 className="font-semibold text-sm mb-3">Previzualizare rapidă</h3>
              <div className="flex gap-3 flex-wrap">
                <button style={{ background: theme.colors.primary, color: theme.colors.primaryForeground, borderRadius: theme.buttons.borderRadius, padding: `${theme.buttons.paddingY}px ${theme.buttons.paddingX}px`, fontWeight: theme.buttons.fontWeight }}>Buton Primar</button>
                <button style={{ background: theme.colors.secondary, color: theme.colors.secondaryForeground, borderRadius: theme.buttons.borderRadius, padding: `${theme.buttons.paddingY}px ${theme.buttons.paddingX}px`, fontWeight: theme.buttons.fontWeight }}>Buton Secundar</button>
                <button style={{ background: "transparent", color: theme.colors.primary, border: `2px solid ${theme.colors.primary}`, borderRadius: theme.buttons.borderRadius, padding: `${theme.buttons.paddingY}px ${theme.buttons.paddingX}px`, fontWeight: theme.buttons.fontWeight }}>Buton Outline</button>
                <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.border}`, borderRadius: theme.layout.cardBorderRadius, padding: 16 }}>
                  <p style={{ color: theme.colors.foreground, fontWeight: 600 }}>Card exemplu</p>
                  <p style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>Text secundar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TIPOGRAFIE ══════ */}
        <TabsContent value="typography">
          <Card>
            <CardHeader><CardTitle className="text-lg">Tipografie</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Font Body</Label>
                  <Select value={theme.typography.fontFamily} onValueChange={v => setTypo("fontFamily", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Titluri</Label>
                  <Select value={theme.typography.fontFamilyHeadings} onValueChange={v => setTypo("fontFamilyHeadings", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Dimensiune bază (px)</Label><Input type="number" value={theme.typography.baseFontSize} onChange={e => setTypo("baseFontSize", Number(e.target.value))} /></div>
                <div><Label>Line Height</Label><Input type="number" step="0.1" value={theme.typography.lineHeight} onChange={e => setTypo("lineHeight", Number(e.target.value))} /></div>
              </div>
              <Separator />
              <h3 className="font-semibold text-sm">Titluri</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["h1", "h2", "h3"] as const).map(h => (
                  <div key={h} className="space-y-2">
                    <Label className="uppercase text-xs">{h}</Label>
                    <Input type="number" value={theme.typography[`${h}Size`]} onChange={e => setTypo(`${h}Size`, Number(e.target.value))} placeholder="Dimensiune (px)" />
                    <Select value={theme.typography[`${h}Weight`]} onValueChange={v => setTypo(`${h}Weight`, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["400", "500", "600", "700", "800", "900"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Separator />
              <h3 className="font-semibold text-sm">Previzualizare</h3>
              <div style={{ fontFamily: `'${theme.typography.fontFamily}', sans-serif` }}>
                <h1 style={{ fontFamily: `'${theme.typography.fontFamilyHeadings}', sans-serif`, fontSize: theme.typography.h1Size, fontWeight: Number(theme.typography.h1Weight) }}>Titlu H1</h1>
                <h2 style={{ fontFamily: `'${theme.typography.fontFamilyHeadings}', sans-serif`, fontSize: theme.typography.h2Size, fontWeight: Number(theme.typography.h2Weight) }}>Titlu H2</h2>
                <h3 style={{ fontFamily: `'${theme.typography.fontFamilyHeadings}', sans-serif`, fontSize: theme.typography.h3Size, fontWeight: Number(theme.typography.h3Weight) }}>Titlu H3</h3>
                <p style={{ fontSize: theme.typography.baseFontSize, lineHeight: theme.typography.lineHeight }}>Acesta este un paragraf de exemplu pentru previzualizare font body.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ BUTOANE ══════ */}
        <TabsContent value="buttons">
          <Card>
            <CardHeader><CardTitle className="text-lg">Stiluri Butoane</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Border Radius (px)</Label><Input type="number" value={theme.buttons.borderRadius} onChange={e => setBtn("borderRadius", Number(e.target.value))} /></div>
                <div><Label>Padding Orizontal (px)</Label><Input type="number" value={theme.buttons.paddingX} onChange={e => setBtn("paddingX", Number(e.target.value))} /></div>
                <div><Label>Padding Vertical (px)</Label><Input type="number" value={theme.buttons.paddingY} onChange={e => setBtn("paddingY", Number(e.target.value))} /></div>
                <div>
                  <Label>Font Weight</Label>
                  <Select value={theme.buttons.fontWeight} onValueChange={v => setBtn("fontWeight", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["400", "500", "600", "700", "800"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text Transform</Label>
                  <Select value={theme.buttons.textTransform} onValueChange={v => setBtn("textTransform", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Normal</SelectItem>
                      <SelectItem value="uppercase">UPPERCASE</SelectItem>
                      <SelectItem value="capitalize">Capitalize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Efect Hover</Label>
                  <Select value={theme.buttons.hoverEffect} onValueChange={v => setBtn("hoverEffect", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="darken">Întunecă</SelectItem>
                      <SelectItem value="lighten">Luminează</SelectItem>
                      <SelectItem value="shadow">Umbră</SelectItem>
                      <SelectItem value="scale">Mărește</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ LAYOUT ══════ */}
        <TabsContent value="layout">
          <Card>
            <CardHeader><CardTitle className="text-lg">Layout & Spațiere</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Lățime maximă container (px)</Label><Input type="number" value={theme.layout.containerMaxWidth} onChange={e => setLay("containerMaxWidth", Number(e.target.value))} /></div>
                <div><Label>Spațiere secțiuni (px)</Label><Input type="number" value={theme.layout.sectionSpacing} onChange={e => setLay("sectionSpacing", Number(e.target.value))} /></div>
                <div><Label>Border Radius Carduri (px)</Label><Input type="number" value={theme.layout.cardBorderRadius} onChange={e => setLay("cardBorderRadius", Number(e.target.value))} /></div>
                <div>
                  <Label>Stil Header</Label>
                  <Select value={theme.layout.headerStyle} onValueChange={v => setLay("headerStyle", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ CSS CUSTOM ══════ */}
        <TabsContent value="css">
          <Card>
            <CardHeader><CardTitle className="text-lg">CSS Personalizat</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Scrie CSS suplimentar care se aplică global în magazin. Atenție: CSS-ul invalid poate afecta aspectul.
              </p>
              <Textarea
                value={theme.customCss}
                onChange={e => setTheme(t => ({ ...t, customCss: e.target.value }))}
                rows={16}
                className="font-mono text-sm"
                placeholder={`/* Exemplu: */\n.product-card:hover {\n  transform: scale(1.02);\n  box-shadow: 0 8px 24px rgba(0,0,0,0.12);\n}`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
