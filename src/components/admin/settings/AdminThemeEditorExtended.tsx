import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Loader2, Upload, Trash2, Image, Type, Palette, Shield } from "lucide-react";

interface ExtendedTheme {
  heading_size: string;
  btn_text_color: string;
  btn_bg_color: string;
  btn_text_style: string;
  cta_text_color: string;
  cta_bg_color: string;
  cta_text_style: string;
  bg_color: string;
  trust_icons: Array<{ url: string; alt: string }>;
}

const DEFAULT_EXTENDED: ExtendedTheme = {
  heading_size: "standard",
  btn_text_color: "#ffffff",
  btn_bg_color: "#1e3a5f",
  btn_text_style: "normal",
  cta_text_color: "#ffffff",
  cta_bg_color: "#e87722",
  cta_text_style: "bold",
  bg_color: "#f5f7fa",
  trust_icons: [],
};

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" style={{ padding: 0 }} />
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs font-mono" />
      </div>
    </div>
  );
}

export default function AdminThemeEditorExtended() {
  const [theme, setTheme] = useState<ExtendedTheme>(DEFAULT_EXTENDED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("key, value_json")
      .in("key", ["heading_size", "btn_text_color", "btn_bg_color", "btn_text_style", "cta_text_color", "cta_bg_color", "cta_text_style", "bg_color", "trust_icons"])
      .then(({ data }) => {
        const map: Record<string, any> = {};
        (data || []).forEach(r => { map[r.key] = r.value_json; });
        setTheme({
          heading_size: map.heading_size ?? DEFAULT_EXTENDED.heading_size,
          btn_text_color: map.btn_text_color ?? DEFAULT_EXTENDED.btn_text_color,
          btn_bg_color: map.btn_bg_color ?? DEFAULT_EXTENDED.btn_bg_color,
          btn_text_style: map.btn_text_style ?? DEFAULT_EXTENDED.btn_text_style,
          cta_text_color: map.cta_text_color ?? DEFAULT_EXTENDED.cta_text_color,
          cta_bg_color: map.cta_bg_color ?? DEFAULT_EXTENDED.cta_bg_color,
          cta_text_style: map.cta_text_style ?? DEFAULT_EXTENDED.cta_text_style,
          bg_color: map.bg_color ?? DEFAULT_EXTENDED.bg_color,
          trust_icons: Array.isArray(map.trust_icons) ? map.trust_icons : [],
        });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const entries = Object.entries(theme);
    for (const [key, value] of entries) {
      await supabase.from("app_settings").upsert(
        { key, value_json: value as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    setSaving(false);
    toast.success("Setări Gomag Design salvate!");
  };

  const addTrustIcon = () => {
    if (theme.trust_icons.length >= 6) return;
    setTheme(t => ({ ...t, trust_icons: [...t.trust_icons, { url: "", alt: "" }] }));
  };

  const updateTrustIcon = (i: number, field: "url" | "alt", val: string) => {
    setTheme(t => {
      const icons = [...t.trust_icons];
      icons[i] = { ...icons[i], [field]: val };
      return { ...t, trust_icons: icons };
    });
  };

  const removeTrustIcon = (i: number) => {
    setTheme(t => ({ ...t, trust_icons: t.trust_icons.filter((_, idx) => idx !== i) }));
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Configurator Design Gomag</h2>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvează
        </Button>
      </div>

      {/* 1. Titluri */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> Titluri</CardTitle></CardHeader>
        <CardContent>
          <Label>Dimensiune</Label>
          <Select value={theme.heading_size} onValueChange={v => setTheme(t => ({ ...t, heading_size: v }))}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Mic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="medium">Mediu</SelectItem>
              <SelectItem value="large">Mare</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Modifica dimensiunea h1/h2/h3 pe tot site-ul</p>
        </CardContent>
      </Card>

      {/* 2. Butoane Standard */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Butoane Standard</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker label="Culoare text butoane" value={theme.btn_text_color} onChange={v => setTheme(t => ({ ...t, btn_text_color: v }))} />
            <ColorPicker label="Fundal butoane" value={theme.btn_bg_color} onChange={v => setTheme(t => ({ ...t, btn_bg_color: v }))} />
          </div>
          <div>
            <Label>Stil text</Label>
            <div className="flex gap-1 mt-1">
              {[
                { val: "normal", label: "L" }, { val: "bold", label: "B" },
                { val: "italic", label: "I" }, { val: "underline", label: "U" },
                { val: "uppercase", label: "TT" },
              ].map(s => (
                <Button key={s.val} size="sm" variant={theme.btn_text_style === s.val ? "default" : "outline"}
                  className="w-9 h-9 text-xs font-bold" onClick={() => setTheme(t => ({ ...t, btn_text_style: s.val }))}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <button style={{ background: theme.btn_bg_color, color: theme.btn_text_color, padding: "8px 20px", borderRadius: 6, fontWeight: theme.btn_text_style === "bold" ? 700 : 400, fontStyle: theme.btn_text_style === "italic" ? "italic" : "normal", textDecoration: theme.btn_text_style === "underline" ? "underline" : "none", textTransform: theme.btn_text_style === "uppercase" ? "uppercase" : "none" as any, fontSize: 14 }}>
              Buton Standard
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Call To Action */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Call To Action</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker label="Culoare text buton CTA" value={theme.cta_text_color} onChange={v => setTheme(t => ({ ...t, cta_text_color: v }))} />
            <ColorPicker label="Fundal buton CTA" value={theme.cta_bg_color} onChange={v => setTheme(t => ({ ...t, cta_bg_color: v }))} />
          </div>
          <div>
            <Label>Stil text</Label>
            <div className="flex gap-1 mt-1">
              {[
                { val: "normal", label: "L" }, { val: "bold", label: "B" },
                { val: "italic", label: "I" }, { val: "underline", label: "U" },
                { val: "uppercase", label: "TT" },
              ].map(s => (
                <Button key={s.val} size="sm" variant={theme.cta_text_style === s.val ? "default" : "outline"}
                  className="w-9 h-9 text-xs font-bold" onClick={() => setTheme(t => ({ ...t, cta_text_style: s.val }))}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <button style={{ background: theme.cta_bg_color, color: theme.cta_text_color, padding: "10px 24px", borderRadius: 6, fontWeight: theme.cta_text_style === "bold" ? 700 : 400, fontStyle: theme.cta_text_style === "italic" ? "italic" : "normal", textDecoration: theme.cta_text_style === "underline" ? "underline" : "none", textTransform: theme.cta_text_style === "uppercase" ? "uppercase" : "none" as any, fontSize: 14 }}>
              Adaugă în coș
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Fundal */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Fundal</CardTitle></CardHeader>
        <CardContent>
          <ColorPicker label="Culoare fundal general" value={theme.bg_color} onChange={v => setTheme(t => ({ ...t, bg_color: v }))} />
        </CardContent>
      </Card>

      {/* 5. Trust Icons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Icon-uri de Trust</CardTitle>
            <Button size="sm" variant="outline" onClick={addTrustIcon} disabled={theme.trust_icons.length >= 6}>
              <Upload className="w-3 h-3 mr-1" /> Adaugă ({theme.trust_icons.length}/6)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {theme.trust_icons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Niciun icon de trust adăugat.</p>
          ) : (
            <div className="space-y-3">
              {theme.trust_icons.map((icon, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {icon.url ? <img src={icon.url} alt={icon.alt} className="w-10 h-10 object-contain" /> : <Image className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input value={icon.url} onChange={e => updateTrustIcon(i, "url", e.target.value)} placeholder="URL imagine" className="h-8 text-xs" />
                    <Input value={icon.alt} onChange={e => updateTrustIcon(i, "alt", e.target.value)} placeholder="Text alternativ" className="h-8 text-xs" />
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeTrustIcon(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
