import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, RotateCcw, Loader2, LayoutGrid, PanelTop, Columns, MoveUp, MoveDown, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface LayoutSettings {
  [key: string]: any;
}

const DEFAULTS: LayoutSettings = {
  product_grid_columns: 4,
  product_grid_mobile_columns: 2,
  product_card_style: "grid",
  product_sort_order: "default",
  products_per_page: 12,
  pagination_style: "pages",
  header_logo_position: "left",
  header_nav_position: "center",
  header_sticky: true,
  header_height: "normal",
  header_transparent_hero: false,
  header_cta_show: false,
  header_cta_text: "",
  header_cta_url: "",
  footer_columns: 4,
  footer_sol_anpc_position: "inside",
  section_alignment: "center",
  section_width: "contained",
};

export default function ControlLayout() {
  const [settings, setSettings] = useState<LayoutSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("site_layout_settings")
      .select("setting_key, value_json")
      .then(({ data }: any) => {
        if (data) {
          const merged = { ...DEFAULTS };
          data.forEach((row: any) => {
            if (row.setting_key in merged) {
              const val = row.value_json;
              merged[row.setting_key] = typeof val === "string" ? val.replace(/^"|"$/g, "") : val;
            }
          });
          setSettings(merged);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await (supabase as any)
        .from("site_layout_settings")
        .update({ value_json: typeof value === "string" ? JSON.stringify(value) : value, updated_at: new Date().toISOString() })
        .eq("setting_key", key);
    }
    toast.success("Layout salvat!");
    setSaving(false);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    toast.info("Resetat la valorile implicite. Salvează pentru a aplica.");
  };

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-1" /> Resetează</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvează Layout
          </Button>
        </div>
      </div>

      {/* Header Layout */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PanelTop className="w-5 h-5 text-primary" /> Layout Header</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Poziție Logo</Label>
              <Select value={settings.header_logo_position} onValueChange={(v) => update("header_logo_position", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Stânga</SelectItem><SelectItem value="center">Centru</SelectItem><SelectItem value="right">Dreapta</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Poziție Navigație</Label>
              <Select value={settings.header_nav_position} onValueChange={(v) => update("header_nav_position", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Stânga</SelectItem><SelectItem value="center">Centru</SelectItem><SelectItem value="right">Dreapta</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Înălțime Header</Label>
              <Select value={settings.header_height} onValueChange={(v) => update("header_height", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="compact">Compact</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="tall">Înalt</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={settings.header_sticky === true || settings.header_sticky === "true"} onCheckedChange={(v) => update("header_sticky", v)} />
              <Label>Header Sticky</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.header_transparent_hero === true || settings.header_transparent_hero === "true"} onCheckedChange={(v) => update("header_transparent_hero", v)} />
              <Label>Transparent pe Hero</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.header_cta_show === true || settings.header_cta_show === "true"} onCheckedChange={(v) => update("header_cta_show", v)} />
              <Label>Buton CTA în Header</Label>
            </div>
          </div>
          {(settings.header_cta_show === true || settings.header_cta_show === "true") && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Text CTA</Label><Input value={settings.header_cta_text} onChange={(e) => update("header_cta_text", e.target.value)} /></div>
              <div><Label>URL CTA</Label><Input value={settings.header_cta_url} onChange={(e) => update("header_cta_url", e.target.value)} /></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Grid */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LayoutGrid className="w-5 h-5 text-primary" /> Grid Produse / Oferte</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Coloane Desktop</Label>
              <Select value={String(settings.product_grid_columns)} onValueChange={(v) => update("product_grid_columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coloane Mobile</Label>
              <Select value={String(settings.product_grid_mobile_columns)} onValueChange={(v) => update("product_grid_mobile_columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stil Card</Label>
              <Select value={settings.product_card_style} onValueChange={(v) => update("product_card_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="grid">Grid</SelectItem><SelectItem value="list">Lista</SelectItem><SelectItem value="masonry">Masonry</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Sortare Implicită</Label>
              <Select value={settings.product_sort_order} onValueChange={(v) => update("product_sort_order", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Implicit</SelectItem>
                  <SelectItem value="price_asc">Preț crescător</SelectItem>
                  <SelectItem value="price_desc">Preț descrescător</SelectItem>
                  <SelectItem value="newest">Cele mai noi</SelectItem>
                  <SelectItem value="popular">Cele mai populare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Produse pe pagină</Label>
              <Select value={String(settings.products_per_page)} onValueChange={(v) => update("products_per_page", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="8">8</SelectItem><SelectItem value="12">12</SelectItem><SelectItem value="24">24</SelectItem><SelectItem value="48">48</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stil Paginare</Label>
              <Select value={settings.pagination_style} onValueChange={(v) => update("pagination_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pages">Pagini</SelectItem><SelectItem value="load_more">Load More</SelectItem><SelectItem value="infinite">Infinite Scroll</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Layout */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Columns className="w-5 h-5 text-primary" /> Layout Footer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Coloane Footer</Label>
              <Select value={String(settings.footer_columns)} onValueChange={(v) => update("footer_columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem><SelectItem value="5">5</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Poziție SOL + ANPC</Label>
              <Select value={settings.footer_sol_anpc_position} onValueChange={(v) => update("footer_sol_anpc_position", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="inside">În bara footer</SelectItem><SelectItem value="separate">Rând separat</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Aliniere Secțiuni</Label>
              <Select value={settings.section_alignment} onValueChange={(v) => update("section_alignment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Stânga</SelectItem><SelectItem value="center">Centru</SelectItem><SelectItem value="right">Dreapta</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lățime Secțiuni</Label>
              <Select value={settings.section_width} onValueChange={(v) => update("section_width", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="full">Full Width</SelectItem><SelectItem value="contained">Contained</SelectItem><SelectItem value="wide">Wide</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
