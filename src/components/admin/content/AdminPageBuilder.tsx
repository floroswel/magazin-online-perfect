import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, GripVertical, MoveUp, MoveDown, Layout, Type, Image, Grid3X3, Newspaper, Mail, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PageSection {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  config: Record<string, any>;
}

const SECTION_TYPES = [
  { value: "hero", label: "Hero Slider", icon: <Layout className="w-4 h-4" /> },
  { value: "text_image", label: "Text + Imagine", icon: <Type className="w-4 h-4" /> },
  { value: "product_grid", label: "Grilă Produse", icon: <ShoppingBag className="w-4 h-4" /> },
  { value: "category_grid", label: "Grilă Categorii", icon: <Grid3X3 className="w-4 h-4" /> },
  { value: "banner", label: "Banner Full-width", icon: <Image className="w-4 h-4" /> },
  { value: "blog_preview", label: "Blog Preview", icon: <Newspaper className="w-4 h-4" /> },
  { value: "newsletter", label: "Newsletter Signup", icon: <Mail className="w-4 h-4" /> },
  { value: "custom_html", label: "HTML Personalizat", icon: <Type className="w-4 h-4" /> },
];

const defaultConfigForType = (type: string): Record<string, any> => {
  switch (type) {
    case "hero": return { autoplay: true, interval: 5000 };
    case "text_image": return { heading: "", body: "", image_url: "", image_position: "right", bg_color: "", padding: "py-12" };
    case "product_grid": return { source: "featured", limit: 8, columns: 4 };
    case "category_grid": return { limit: 6, columns: 3, show_images: true };
    case "banner": return { image_url: "", link_url: "", alt: "", height: "300px" };
    case "blog_preview": return { limit: 3 };
    case "newsletter": return { heading: "Abonează-te la newsletter", description: "Primește oferte și noutăți", bg_color: "" };
    case "custom_html": return { html: "" };
    default: return {};
  }
};

export default function AdminPageBuilder() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "page_builder_sections")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json)) {
          setSections(data.value_json as unknown as PageSection[]);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "page_builder_sections", value_json: sections as any, description: "Page builder sections config" }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Layout salvat!");
    setSaving(false);
  };

  const addSection = (type: string) => {
    const meta = SECTION_TYPES.find((s) => s.value === type);
    setSections((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        type,
        title: meta?.label || type,
        visible: true,
        config: defaultConfigForType(type),
      },
    ]);
  };

  const updateSection = (id: string, updates: Partial<PageSection>) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)));
  };

  const updateConfig = (id: string, key: string, val: any) => {
    setSections((s) =>
      s.map((sec) => (sec.id === id ? { ...sec, config: { ...sec.config, [key]: val } } : sec))
    );
  };

  const removeSection = (id: string) => {
    setSections((s) => s.filter((sec) => sec.id !== id));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr);
  };

  const renderSectionConfig = (section: PageSection) => {
    const { config, id, type } = section;
    switch (type) {
      case "text_image":
        return (
          <div className="space-y-3">
            <div><Label>Titlu</Label><Input value={config.heading || ""} onChange={(e) => updateConfig(id, "heading", e.target.value)} /></div>
            <div><Label>Text</Label><Textarea value={config.body || ""} onChange={(e) => updateConfig(id, "body", e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>URL imagine</Label><Input value={config.image_url || ""} onChange={(e) => updateConfig(id, "image_url", e.target.value)} /></div>
              <div>
                <Label>Poziție imagine</Label>
                <Select value={config.image_position || "right"} onValueChange={(v) => updateConfig(id, "image_position", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Stânga</SelectItem>
                    <SelectItem value="right">Dreapta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "product_grid":
        return (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Sursă</Label>
              <Select value={config.source || "featured"} onValueChange={(v) => updateConfig(id, "source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Recomandate</SelectItem>
                  <SelectItem value="newest">Cele mai noi</SelectItem>
                  <SelectItem value="bestsellers">Cele mai vândute</SelectItem>
                  <SelectItem value="sale">La reducere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Limită</Label><Input type="number" value={config.limit || 8} onChange={(e) => updateConfig(id, "limit", +e.target.value)} /></div>
            <div><Label>Coloane</Label><Input type="number" value={config.columns || 4} onChange={(e) => updateConfig(id, "columns", +e.target.value)} min={2} max={6} /></div>
          </div>
        );
      case "banner":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>URL imagine</Label><Input value={config.image_url || ""} onChange={(e) => updateConfig(id, "image_url", e.target.value)} /></div>
            <div><Label>Link</Label><Input value={config.link_url || ""} onChange={(e) => updateConfig(id, "link_url", e.target.value)} /></div>
          </div>
        );
      case "newsletter":
        return (
          <div className="space-y-3">
            <div><Label>Titlu</Label><Input value={config.heading || ""} onChange={(e) => updateConfig(id, "heading", e.target.value)} /></div>
            <div><Label>Descriere</Label><Input value={config.description || ""} onChange={(e) => updateConfig(id, "description", e.target.value)} /></div>
          </div>
        );
      case "custom_html":
        return (
          <div><Label>HTML</Label><Textarea value={config.html || ""} onChange={(e) => updateConfig(id, "html", e.target.value)} rows={4} className="font-mono text-xs" /></div>
        );
      case "category_grid":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Limită categorii</Label><Input type="number" value={config.limit || 6} onChange={(e) => updateConfig(id, "limit", +e.target.value)} /></div>
            <div><Label>Coloane</Label><Input type="number" value={config.columns || 3} onChange={(e) => updateConfig(id, "columns", +e.target.value)} min={2} max={6} /></div>
          </div>
        );
      default:
        return <p className="text-xs text-muted-foreground">Configurare implicită.</p>;
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" /> Page Builder
          </h1>
          <p className="text-sm text-muted-foreground">Construiește layout-ul homepage-ului prin drag & drop</p>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={addSection}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="+ Adaugă secțiune" />
            </SelectTrigger>
            <SelectContent>
              {SECTION_TYPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">{s.icon} {s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvează
          </Button>
        </div>
      </div>

      {sections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Layout className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nicio secțiune. Adaugă secțiuni folosind butonul de sus.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sections.map((section, idx) => {
          const meta = SECTION_TYPES.find((s) => s.value === section.type);
          return (
            <Card key={section.id} className={`border-border ${!section.visible ? "opacity-50" : ""}`}>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="flex items-center gap-2 flex-1">
                  {meta?.icon}
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="h-7 text-sm font-medium border-none shadow-none p-0 focus-visible:ring-0"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={section.visible} onCheckedChange={(v) => updateSection(section.id, { visible: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                    <MoveUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                    <MoveDown className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(section.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-4">
                {renderSectionConfig(section)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
