import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Power, PowerOff, Eye, EyeOff, Filter, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface VisibilityRow {
  id: string;
  element_key: string;
  is_active: boolean;
  category: string;
  label: string;
  path_label: string;
  scheduled_from: string | null;
  scheduled_until: string | null;
  updated_at: string;
  updated_by: string | null;
}

const CATEGORIES = [
  "header", "hero", "sections", "popups", "footer",
  "compliance", "promotional", "social_trust", "forms", "media", "notifications",
];

const CATEGORY_LABELS: Record<string, string> = {
  header: "Header & Navigație",
  hero: "Hero & Bannere",
  sections: "Secțiuni & Conținut",
  popups: "Popup-uri & Modale",
  footer: "Footer",
  compliance: "Conformitate & Legal",
  promotional: "Promoțional",
  social_trust: "Social & Trust",
  forms: "Formulare & Widget-uri",
  media: "Media",
  notifications: "Notificări & Alerte",
};

const DEFAULT_ELEMENTS: Omit<VisibilityRow, "id" | "updated_at" | "updated_by">[] = [
  { element_key: "header_logo", is_active: true, category: "header", label: "Logo", path_label: "Header > Logo", scheduled_from: null, scheduled_until: null },
  { element_key: "header_menu", is_active: true, category: "header", label: "Meniu Navigație", path_label: "Header > Meniu", scheduled_from: null, scheduled_until: null },
  { element_key: "header_search", is_active: true, category: "header", label: "Bara de Căutare", path_label: "Header > Search", scheduled_from: null, scheduled_until: null },
  { element_key: "header_cart", is_active: true, category: "header", label: "Icon Coș", path_label: "Header > Coș", scheduled_from: null, scheduled_until: null },
  { element_key: "header_language", is_active: true, category: "header", label: "Selector Limbă", path_label: "Header > Limba", scheduled_from: null, scheduled_until: null },
  { element_key: "hero_image", is_active: true, category: "hero", label: "Imagine Hero", path_label: "Hero > Imagine", scheduled_from: null, scheduled_until: null },
  { element_key: "hero_headline", is_active: true, category: "hero", label: "Titlu Hero", path_label: "Hero > Titlu", scheduled_from: null, scheduled_until: null },
  { element_key: "hero_subtitle", is_active: true, category: "hero", label: "Subtitlu Hero", path_label: "Hero > Subtitlu", scheduled_from: null, scheduled_until: null },
  { element_key: "hero_cta", is_active: true, category: "hero", label: "Butoane CTA Hero", path_label: "Hero > CTA", scheduled_from: null, scheduled_until: null },
  { element_key: "section_personalizare", is_active: true, category: "sections", label: "Secțiune Personalizare", path_label: "Homepage > Personalizare", scheduled_from: null, scheduled_until: null },
  { element_key: "section_quiz", is_active: true, category: "sections", label: "Quiz Parfum", path_label: "Homepage > Quiz", scheduled_from: null, scheduled_until: null },
  { element_key: "section_featured", is_active: true, category: "sections", label: "Produse Recomandate", path_label: "Homepage > Featured", scheduled_from: null, scheduled_until: null },
  { element_key: "section_bestsellers", is_active: true, category: "sections", label: "Bestsellers", path_label: "Homepage > Bestsellers", scheduled_from: null, scheduled_until: null },
  { element_key: "section_why_ventuza", is_active: true, category: "sections", label: "De Ce VENTUZA", path_label: "Homepage > Why", scheduled_from: null, scheduled_until: null },
  { element_key: "section_process", is_active: true, category: "sections", label: "Procesul Nostru", path_label: "Homepage > Proces", scheduled_from: null, scheduled_until: null },
  { element_key: "section_testimonials", is_active: true, category: "sections", label: "Testimoniale", path_label: "Homepage > Testimoniale", scheduled_from: null, scheduled_until: null },
  { element_key: "quick_filters", is_active: true, category: "sections", label: "Filtre Rapide", path_label: "Homepage > Filtre Rapide", scheduled_from: null, scheduled_until: null },
  { element_key: "coupon_collector", is_active: true, category: "promotional", label: "Cupoane Homepage", path_label: "Homepage > Cupoane", scheduled_from: null, scheduled_until: null },
  { element_key: "top_vendors", is_active: true, category: "sections", label: "Top Artizani", path_label: "Homepage > Top Artizani", scheduled_from: null, scheduled_until: null },
  { element_key: "buy_again", is_active: true, category: "sections", label: "Cumpără Din Nou", path_label: "Homepage > Cumpără Din Nou", scheduled_from: null, scheduled_until: null },
  { element_key: "brand_logos", is_active: true, category: "sections", label: "Logo-uri Branduri", path_label: "Homepage > Branduri", scheduled_from: null, scheduled_until: null },
  { element_key: "instagram_feed", is_active: true, category: "media", label: "Feed Instagram", path_label: "Homepage > Instagram", scheduled_from: null, scheduled_until: null },
  { element_key: "free_shipping_bar", is_active: true, category: "header", label: "Bară Livrare Gratuită", path_label: "Header > Free Shipping", scheduled_from: null, scheduled_until: null },
  { element_key: "mega_menu", is_active: true, category: "header", label: "Mega Meniu Categorii", path_label: "Header > Mega Menu", scheduled_from: null, scheduled_until: null },
  { element_key: "popup_welcome", is_active: true, category: "popups", label: "Popup Bun Venit", path_label: "Popup > Welcome", scheduled_from: null, scheduled_until: null },
  { element_key: "popup_newsletter", is_active: true, category: "popups", label: "Popup Newsletter", path_label: "Popup > Newsletter", scheduled_from: null, scheduled_until: null },
  { element_key: "popup_exit_intent", is_active: false, category: "popups", label: "Popup Exit Intent", path_label: "Popup > Exit", scheduled_from: null, scheduled_until: null },
  { element_key: "footer_columns", is_active: true, category: "footer", label: "Coloane Footer", path_label: "Footer > Coloane", scheduled_from: null, scheduled_until: null },
  { element_key: "footer_social", is_active: true, category: "footer", label: "Icoane Social", path_label: "Footer > Social", scheduled_from: null, scheduled_until: null },
  { element_key: "footer_newsletter", is_active: true, category: "footer", label: "Formular Newsletter", path_label: "Footer > Newsletter", scheduled_from: null, scheduled_until: null },
  { element_key: "compliance_sol", is_active: true, category: "compliance", label: "Link SOL", path_label: "Footer > Compliance > SOL", scheduled_from: null, scheduled_until: null },
  { element_key: "compliance_anpc", is_active: true, category: "compliance", label: "Link ANPC", path_label: "Footer > Compliance > ANPC", scheduled_from: null, scheduled_until: null },
  { element_key: "compliance_gdpr", is_active: true, category: "compliance", label: "Banner Cookie GDPR", path_label: "Global > GDPR", scheduled_from: null, scheduled_until: null },
  { element_key: "compliance_privacy", is_active: true, category: "compliance", label: "Link-uri Privacy", path_label: "Footer > Privacy", scheduled_from: null, scheduled_until: null },
  { element_key: "promo_badges", is_active: true, category: "promotional", label: "Badge-uri Discount", path_label: "Produse > Badge", scheduled_from: null, scheduled_until: null },
  { element_key: "promo_countdown", is_active: true, category: "promotional", label: "Timer Countdown", path_label: "Produse > Countdown", scheduled_from: null, scheduled_until: null },
  { element_key: "promo_sale_labels", is_active: true, category: "promotional", label: "Etichete Reducere", path_label: "Produse > Sale", scheduled_from: null, scheduled_until: null },
  { element_key: "trust_testimonials", is_active: true, category: "social_trust", label: "Testimoniale", path_label: "Global > Testimoniale", scheduled_from: null, scheduled_until: null },
  { element_key: "trust_ratings", is_active: true, category: "social_trust", label: "Rating Stele", path_label: "Produse > Rating", scheduled_from: null, scheduled_until: null },
  { element_key: "trust_badges", is_active: true, category: "social_trust", label: "Badge-uri Trust", path_label: "Footer > Trust", scheduled_from: null, scheduled_until: null },
  { element_key: "widget_contact", is_active: true, category: "forms", label: "Formular Contact", path_label: "Pagini > Contact", scheduled_from: null, scheduled_until: null },
  { element_key: "widget_search", is_active: true, category: "forms", label: "Widget Căutare", path_label: "Global > Search", scheduled_from: null, scheduled_until: null },
  { element_key: "widget_chat", is_active: true, category: "forms", label: "Widget Chat", path_label: "Global > Chat", scheduled_from: null, scheduled_until: null },
  { element_key: "media_gallery", is_active: true, category: "media", label: "Galerie Produs", path_label: "Produs > Galerie", scheduled_from: null, scheduled_until: null },
  { element_key: "media_hero_video", is_active: false, category: "media", label: "Video Hero", path_label: "Hero > Video", scheduled_from: null, scheduled_until: null },
  { element_key: "notification_social_proof", is_active: true, category: "notifications", label: "Social Proof Popup", path_label: "Global > Social Proof", scheduled_from: null, scheduled_until: null },
  { element_key: "notification_push", is_active: true, category: "notifications", label: "Push Notifications", path_label: "Global > Push", scheduled_from: null, scheduled_until: null },
];

export default function ControlVisibility() {
  const [rows, setRows] = useState<VisibilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const fetchRows = async () => {
    const { data } = await (supabase as any)
      .from("site_visibility_settings")
      .select("*")
      .order("category, label");
    if (data && data.length > 0) {
      setRows(data);
    } else if (data && data.length === 0) {
      // Seed defaults
      const { data: seeded } = await (supabase as any)
        .from("site_visibility_settings")
        .insert(DEFAULT_ELEMENTS)
        .select();
      if (seeded) setRows(seeded);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel("visibility_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_visibility_settings" }, () => {
        fetchRows();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleElement = async (id: string, currentValue: boolean) => {
    await (supabase as any)
      .from("site_visibility_settings")
      .update({ is_active: !currentValue, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const bulkToggle = async (active: boolean, ids?: string[]) => {
    const targetIds = ids || Array.from(selected);
    if (targetIds.length === 0) return;
    await (supabase as any)
      .from("site_visibility_settings")
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .in("id", targetIds);
    setSelected(new Set());
    toast.success(`${targetIds.length} elemente ${active ? "activate" : "dezactivate"}`);
  };

  const toggleCategory = async (category: string, active: boolean) => {
    const ids = rows.filter((r) => r.category === category).map((r) => r.id);
    await bulkToggle(active, ids);
  };

  const globalToggle = async (active: boolean) => {
    const ids = rows.map((r) => r.id);
    await bulkToggle(active, ids);
  };

  const updateSchedule = async (id: string, field: "scheduled_from" | "scheduled_until", value: string) => {
    await (supabase as any)
      .from("site_visibility_settings")
      .update({ [field]: value || null, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const filtered = rows.filter((r) => {
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (search && !r.label.toLowerCase().includes(search.toLowerCase()) && !r.path_label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = rows.filter((r) => r.is_active).length;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-4">
      {/* Stats + Master Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Eye className="w-3.5 h-3.5 mr-1" /> {activeCount} / {rows.length} active
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline"><Power className="w-3.5 h-3.5 mr-1" /> Activează Tot</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activează toate elementele?</AlertDialogTitle>
              <AlertDialogDescription>Toate cele {rows.length} elemente vor fi activate.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={() => globalToggle(true)}>Activează Tot</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline"><PowerOff className="w-3.5 h-3.5 mr-1" /> Dezactivează Tot</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dezactivează toate elementele?</AlertDialogTitle>
              <AlertDialogDescription>Toate cele {rows.length} elemente vor fi dezactivate. Site-ul va fi gol.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={() => globalToggle(false)}>Dezactivează Tot</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button size="sm" variant={selectMode ? "default" : "outline"} onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}>
          <Checkbox className="mr-1 h-3.5 w-3.5" checked={selectMode} /> Selectare Multiplă
        </Button>
        {selectMode && selected.size > 0 && (
          <>
            <Button size="sm" onClick={() => bulkToggle(true)}><Eye className="w-3.5 h-3.5 mr-1" /> Activează ({selected.size})</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkToggle(false)}><EyeOff className="w-3.5 h-3.5 mr-1" /> Dezactivează ({selected.size})</Button>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută element..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={filterCategory === "all" ? "default" : "outline"} onClick={() => setFilterCategory("all")}>Toate</Button>
          {CATEGORIES.map((cat) => (
            <Button key={cat} size="sm" variant={filterCategory === cat ? "default" : "outline"} onClick={() => setFilterCategory(cat)}>
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Groups */}
      {(filterCategory === "all" ? CATEGORIES : [filterCategory]).map((cat) => {
        const catRows = filtered.filter((r) => r.category === cat);
        if (catRows.length === 0) return null;
        const catActive = catRows.filter((r) => r.is_active).length;
        return (
          <Card key={cat} className="border-border bg-card">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                {CATEGORY_LABELS[cat]}
                <Badge variant="secondary" className="text-xs">{catActive}/{catRows.length}</Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleCategory(cat, true)}>
                  <Eye className="w-3 h-3 mr-1" /> On
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleCategory(cat, false)}>
                  <EyeOff className="w-3 h-3 mr-1" /> Off
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {catRows.map((row) => (
                <div key={row.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${row.is_active ? "bg-muted/30 border-border" : "bg-muted/10 border-border/40 opacity-60"}`}>
                  {selectMode && (
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selected);
                        checked ? newSet.add(row.id) : newSet.delete(row.id);
                        setSelected(newSet);
                      }}
                    />
                  )}
                  <Switch checked={row.is_active} onCheckedChange={() => toggleElement(row.id, row.is_active)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{row.label}</div>
                    <div className="text-xs text-muted-foreground">{row.path_label}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        className="h-7 text-xs w-[150px]"
                        value={row.scheduled_from?.slice(0, 16) || ""}
                        onChange={(e) => updateSchedule(row.id, "scheduled_from", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        title="Vizibil de la"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="datetime-local"
                        className="h-7 text-xs w-[150px]"
                        value={row.scheduled_until?.slice(0, 16) || ""}
                        onChange={(e) => updateSchedule(row.id, "scheduled_until", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        title="Vizibil până la"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0 w-24 text-right">
                    {new Date(row.updated_at).toLocaleDateString("ro")}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
