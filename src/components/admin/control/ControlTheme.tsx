import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Palette, Type, MousePointer, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  "Playfair Display", "Merriweather", "Source Sans Pro", "Nunito", "Ubuntu",
  "PT Sans", "Oswald", "Quicksand", "Cormorant Garamond", "DM Sans",
  "Josefin Sans", "Cabin", "Libre Baskerville",
];

interface ThemeSettings {
  color_mode: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  font_size_scale: string;
  heading_weight: string;
  line_height: string;
  button_shape: string;
  button_style: string;
  button_hover: string;
  border_radius: number;
  spacing_density: string;
}

const DEFAULTS: ThemeSettings = {
  color_mode: "auto",
  primary_color: "#4a7c6f",
  secondary_color: "#8b9d83",
  background_color: "#ffffff",
  text_color: "#1a1a2e",
  font_family: "Inter",
  font_size_scale: "medium",
  heading_weight: "bold",
  line_height: "normal",
  button_shape: "rounded",
  button_style: "filled",
  button_hover: "scale",
  border_radius: 8,
  spacing_density: "normal",
};

export default function ControlTheme() {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULTS);
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

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(theme).map(([key, value]) => ({
      setting_key: key,
      value_json: typeof value === "number" ? value : JSON.stringify(value),
      updated_at: new Date().toISOString(),
    }));
    for (const u of updates) {
      await (supabase as any)
        .from("site_theme_settings")
        .update({ value_json: u.value_json, updated_at: u.updated_at })
        .eq("setting_key", u.setting_key);
    }
    toast.success("Temă salvată!");
    setSaving(false);
  };

  const handleReset = () => {
    setTheme(DEFAULTS);
    toast.info("Resetat la valorile implicite. Salvează pentru a aplica.");
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-1" /> Resetează</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvează Tema
          </Button>
        </div>
      </div>

      {/* Color Theme */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette className="w-5 h-5 text-primary" /> Temă Culori</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mod culoare</Label>
            <Select value={theme.color_mode} onValueChange={(v) => setTheme({ ...theme, color_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (sistem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "primary_color", label: "Culoare Primară" },
              { key: "secondary_color", label: "Culoare Secundară" },
              { key: "background_color", label: "Fundal" },
              { key: "text_color", label: "Text" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={(theme as any)[key]}
                    onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={(theme as any)[key]}
                    onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                    className="flex-1 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="p-6 rounded-lg border" style={{ backgroundColor: theme.background_color, color: theme.text_color }}>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: theme.font_family }}>Previzualizare Temă</h3>
            <p className="text-sm mb-3">Acesta este un text exemplu pentru a vedea culorile aplicate.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: theme.primary_color }}>Buton Primar</button>
              <button className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: theme.secondary_color }}>Buton Secundar</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Type className="w-5 h-5 text-primary" /> Tipografie</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Familie Font</Label>
              <Select value={theme.font_family} onValueChange={(v) => setTheme({ ...theme, font_family: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Scară Dimensiune Font</Label>
              <Select value={theme.font_size_scale} onValueChange={(v) => setTheme({ ...theme, font_size_scale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Mic</SelectItem>
                  <SelectItem value="medium">Mediu</SelectItem>
                  <SelectItem value="large">Mare</SelectItem>
                  <SelectItem value="xl">Extra Mare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Greutate Heading</Label>
              <Select value={theme.heading_weight} onValueChange={(v) => setTheme({ ...theme, heading_weight: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Înălțime Linie</Label>
              <Select value={theme.line_height} onValueChange={(v) => setTheme({ ...theme, line_height: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relaxed">Relaxat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Style */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MousePointer className="w-5 h-5 text-primary" /> Stil Butoane</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Formă</Label>
              <Select value={theme.button_shape} onValueChange={(v) => setTheme({ ...theme, button_shape: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rotunjit</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                  <SelectItem value="sharp">Colțuri Drepte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stil</Label>
              <Select value={theme.button_style} onValueChange={(v) => setTheme({ ...theme, button_style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Plin</SelectItem>
                  <SelectItem value="outlined">Contur</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Efect Hover</Label>
              <Select value={theme.button_hover} onValueChange={(v) => setTheme({ ...theme, button_hover: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="glow">Glow</SelectItem>
                  <SelectItem value="underline">Underline</SelectItem>
                  <SelectItem value="none">Niciunul</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius & Spacing */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Border Radius & Spațiere</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Border Radius Global: {theme.border_radius}px</Label>
            <Slider
              value={[theme.border_radius]}
              onValueChange={([v]) => setTheme({ ...theme, border_radius: v })}
              min={0} max={24} step={1} className="mt-2"
            />
          </div>
          <div>
            <Label>Densitate Spațiere</Label>
            <Select value={theme.spacing_density} onValueChange={(v) => setTheme({ ...theme, spacing_density: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="spacious">Spațios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
