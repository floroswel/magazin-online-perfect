import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Palette, Type, MousePointer, RotateCcw, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { type ThemeSettings, DEFAULTS, applyThemeToDOM } from "@/hooks/useTheme";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  "Playfair Display", "Merriweather", "Source Sans Pro", "Nunito", "Ubuntu",
  "PT Sans", "Oswald", "Quicksand", "Cormorant Garamond", "DM Sans",
  "DM Serif Display", "Josefin Sans", "Cabin", "Libre Baskerville",
  "Crimson Text", "Bitter", "Karla", "Work Sans", "Fira Sans",
];

function hslToHex(hsl: string): string {
  try {
    const parts = hsl.trim().split(/\s+/);
    if (parts.length < 3) return "#4a7c6f";
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch { return "#4a7c6f"; }
}

function hexToHsl(hex: string): string {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "210 40% 50%";
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s: number;
    const l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return "210 40% 50%"; }
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hex = hslToHex(value);
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0"
        />
        <div className="text-xs font-mono text-muted-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

function LivePreview({ theme }: { theme: ThemeSettings }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const bodyFont = theme.font_family || "Inter";
    const headingFont = theme.heading_font || bodyFont;
    const radiusPx = theme.border_radius ?? 8;
    const lhMap: Record<string, string> = { compact: "1.4", normal: "1.6", relaxed: "1.8" };
    const lh = lhMap[theme.line_height] || "1.6";
    const spacingMap: Record<string, string> = { compact: "12px", normal: "20px", spacious: "32px" };
    const spacing = spacingMap[theme.spacing_density] || "20px";

    const fontsToLoad = new Set<string>();
    if (bodyFont !== "Inter") fontsToLoad.add(bodyFont);
    if (headingFont !== "Inter") fontsToLoad.add(headingFont);
    const fontLink = fontsToLoad.size > 0
      ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, "+")}:wght@400;600;700`).join("&")}&display=swap">`
      : "";

    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head>
${fontLink}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: '${bodyFont}', system-ui, sans-serif; 
  background: hsl(${theme.background_color}); 
  color: hsl(${theme.text_color}); 
  padding: ${spacing}; 
  line-height: ${lh};
}
h1, h2, h3 { 
  font-family: '${headingFont}', serif; 
  font-weight: ${theme.heading_weight === "bold" ? 700 : theme.heading_weight === "extrabold" ? 800 : 600}; 
}
.header { 
  background: hsl(${theme.primary_color}); 
  color: white; 
  padding: 16px ${spacing}; 
  border-radius: ${radiusPx}px; 
  margin-bottom: ${spacing}; 
  display: flex; align-items: center; justify-content: space-between; 
}
.header h2 { font-size: 18px; color: white; }
.nav-links { display: flex; gap: 12px; font-size: 13px; }
.nav-links span { opacity: 0.85; cursor: pointer; }
.hero {
  background: linear-gradient(135deg, hsl(${theme.primary_color}), hsl(${theme.secondary_color}));
  color: white; padding: 32px ${spacing}; border-radius: ${radiusPx}px;
  margin-bottom: ${spacing}; text-align: center;
}
.hero h1 { font-size: 22px; margin-bottom: 8px; color: white; }
.hero p { font-size: 13px; opacity: 0.9; margin-bottom: 16px; }
.btn-primary { 
  background: hsl(${theme.accent_color}); color: white; border: none; 
  padding: 10px 24px; border-radius: ${radiusPx}px; font-size: 14px; 
  cursor: pointer; font-weight: 600; 
}
.btn-outline { 
  background: transparent; color: hsl(${theme.primary_color}); 
  border: 2px solid hsl(${theme.primary_color}); padding: 10px 24px; 
  border-radius: ${radiusPx}px; font-size: 14px; cursor: pointer; font-weight: 600; 
}
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${spacing}; margin-bottom: ${spacing}; }
.card { 
  border: 1px solid hsl(${theme.text_color} / 0.12); 
  border-radius: ${radiusPx}px; overflow: hidden; background: hsl(${theme.background_color}); 
}
.card-img { 
  height: 80px; 
  background: linear-gradient(45deg, hsl(${theme.secondary_color} / 0.3), hsl(${theme.accent_color} / 0.3)); 
  display: flex; align-items: center; justify-content: center; font-size: 28px; 
}
.card-body { padding: 12px; }
.card-body h3 { font-size: 14px; margin-bottom: 4px; }
.card-body p { font-size: 12px; color: hsl(${theme.text_color} / 0.6); }
.card-price { 
  font-size: 15px; font-weight: 700; color: hsl(${theme.accent_color}); 
  margin-top: 6px; 
}
.footer { 
  text-align: center; padding: 16px; font-size: 11px; 
  color: hsl(${theme.text_color} / 0.5); 
  border-top: 1px solid hsl(${theme.text_color} / 0.1); 
}
.badge { 
  display: inline-block; background: hsl(${theme.accent_color} / 0.15); 
  color: hsl(${theme.accent_color}); padding: 2px 8px; border-radius: 99px; 
  font-size: 10px; font-weight: 600; margin-bottom: 6px; 
}
</style>
</head><body>
<div class="header">
  <h2>🕯 MamaLucica</h2>
  <div class="nav-links"><span>Acasă</span><span>Produse</span><span>Despre</span><span>🛒</span></div>
</div>
<div class="hero">
  <h1>Lumânări Artizanale</h1>
  <p>Descoperă colecția noastră de parfumuri naturale</p>
  <button class="btn-primary">Cumpără Acum</button>
</div>
<div class="cards">
  <div class="card">
    <div class="card-img">🕯</div>
    <div class="card-body">
      <span class="badge">NOU</span>
      <h3>Lavandă & Miere</h3>
      <p>Lumânare de soia, 200g</p>
      <div class="card-price">89 RON</div>
    </div>
  </div>
  <div class="card">
    <div class="card-img">🌿</div>
    <div class="card-body">
      <span class="badge">POPULAR</span>
      <h3>Eucalipt Fresh</h3>
      <p>Lumânare de soia, 300g</p>
      <div class="card-price">119 RON</div>
    </div>
  </div>
  <div class="card">
    <div class="card-img">🍊</div>
    <div class="card-body">
      <span class="badge">-20%</span>
      <h3>Citrice & Vanilie</h3>
      <p>Lumânare de soia, 250g</p>
      <div class="card-price">95 RON</div>
    </div>
  </div>
</div>
<div style="display:flex;gap:12px;margin-bottom:${spacing};justify-content:center;">
  <button class="btn-primary">Adaugă în Coș</button>
  <button class="btn-outline">Vezi Detalii</button>
</div>
<div class="footer">© 2026 MamaLucica — Lumânări artizanale</div>
</body></html>`);
    doc.close();
  }, [theme]);

  return (
    <div className="sticky top-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Preview Live</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden shadow-lg bg-background">
        <iframe
          ref={iframeRef}
          className="w-full border-0"
          style={{ height: "520px" }}
          title="Theme Preview"
        />
      </div>
    </div>
  );
}

export default function ControlTheme() {
  const [theme, setTheme] = useState<ThemeSettings>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("site_theme_settings")
      .select("setting_key, value_json")
      .then(({ data }: any) => {
        if (data) {
          const merged = { ...DEFAULTS };
          data.forEach((row: any) => {
            if (row.setting_key in merged) {
              (merged as any)[row.setting_key] = typeof row.value_json === "string"
                ? row.value_json.replace(/^"|"$/g, "")
                : row.value_json;
            }
          });
          setTheme(merged);
        }
        setLoading(false);
      });
  }, []);

  // Apply live preview to main site as user edits
  useEffect(() => {
    if (!loading) applyThemeToDOM(theme);
  }, [theme, loading]);

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(theme)) {
      const val = typeof value === "number" ? value : JSON.stringify(value);
      // Upsert: try update first, then insert
      const { data } = await (supabase as any)
        .from("site_theme_settings")
        .update({ value_json: val, updated_at: new Date().toISOString() })
        .eq("setting_key", key)
        .select();
      if (!data || data.length === 0) {
        await (supabase as any)
          .from("site_theme_settings")
          .insert({ setting_key: key, value_json: val });
      }
    }
    toast.success("Temă salvată cu succes!");
    setSaving(false);
  };

  const handleReset = () => {
    setTheme({ ...DEFAULTS });
    toast.info("Resetat la valorile implicite. Salvează pentru a aplica.");
  };

  const update = useCallback((key: keyof ThemeSettings, val: any) => {
    setTheme(prev => ({ ...prev, [key]: val }));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Editor Temă</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Resetează
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvează
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left: Controls */}
        <div className="space-y-5">
          {/* Colors */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4 text-primary" /> Paletă Culori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <ColorPicker label="Primară" value={theme.primary_color} onChange={v => update("primary_color", v)} />
                <ColorPicker label="Secundară" value={theme.secondary_color} onChange={v => update("secondary_color", v)} />
                <ColorPicker label="Accent" value={theme.accent_color} onChange={v => update("accent_color", v)} />
                <ColorPicker label="Fundal" value={theme.background_color} onChange={v => update("background_color", v)} />
                <ColorPicker label="Text" value={theme.text_color} onChange={v => update("text_color", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="w-4 h-4 text-primary" /> Tipografie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Font Principal (Body)</Label>
                  <Select value={theme.font_family} onValueChange={v => update("font_family", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font Titluri (Heading)</Label>
                  <Select value={theme.heading_font} onValueChange={v => update("heading_font", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Dimensiune Font</Label>
                  <Select value={theme.font_size_scale} onValueChange={v => update("font_size_scale", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Mic (14px)</SelectItem>
                      <SelectItem value="medium">Mediu (16px)</SelectItem>
                      <SelectItem value="large">Mare (18px)</SelectItem>
                      <SelectItem value="xl">Extra Mare (20px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Greutate Titluri</Label>
                  <Select value={theme.heading_weight} onValueChange={v => update("heading_weight", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular (600)</SelectItem>
                      <SelectItem value="bold">Bold (700)</SelectItem>
                      <SelectItem value="extrabold">Extra Bold (800)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Înălțime Linie</Label>
                  <Select value={theme.line_height} onValueChange={v => update("line_height", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact (1.4)</SelectItem>
                      <SelectItem value="normal">Normal (1.6)</SelectItem>
                      <SelectItem value="relaxed">Relaxat (1.8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons & Radius */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MousePointer className="w-4 h-4 text-primary" /> Butoane & Forme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Formă Butoane</Label>
                  <Select value={theme.button_shape} onValueChange={v => update("button_shape", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Rotunjit</SelectItem>
                      <SelectItem value="pill">Pill</SelectItem>
                      <SelectItem value="sharp">Colțuri Drepte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Stil Butoane</Label>
                  <Select value={theme.button_style} onValueChange={v => update("button_style", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Plin</SelectItem>
                      <SelectItem value="outlined">Contur</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Efect Hover</Label>
                  <Select value={theme.button_hover} onValueChange={v => update("button_hover", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scale">Scale</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                      <SelectItem value="darken">Darken</SelectItem>
                      <SelectItem value="shadow">Shadow</SelectItem>
                      <SelectItem value="none">Niciunul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Border Radius Global: {theme.border_radius}px</Label>
                <Slider
                  value={[theme.border_radius]}
                  onValueChange={([v]) => update("border_radius", v)}
                  min={0} max={24} step={1} className="mt-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0px (sharp)</span>
                  <span>12px</span>
                  <span>24px (pill)</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">Densitate Spațiere</Label>
                <Select value={theme.spacing_density} onValueChange={v => update("spacing_density", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spațios (Airy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <LivePreview theme={theme} />
      </div>
    </div>
  );
}
