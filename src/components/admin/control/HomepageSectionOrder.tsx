import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, MoveUp, MoveDown, Save, Loader2, LayoutList } from "lucide-react";
import { toast } from "sonner";

const SECTION_LABELS: Record<string, string> = {
  hero_section: "🎬 Hero Slider",
  social_proof_bar: "⭐ Social Proof Bar",
  quick_filters: "🏷️ Filtre Rapide",
  collections_grid: "🗂️ Colecții Grid",
  coupon_collector: "🎫 Cupoane Disponibile",
  flash_deals: "⚡ Oferte Limitate",
  scent_guide_teaser: "🌸 Ghid Parfumuri",
  featured_products: "✨ Produse Recomandate",
  top_vendors: "🏅 Top Artizani",
  brand_story_section: "📖 Povestea Brandului",
  bestsellers_section: "🏆 Cele Mai Iubite",
  buy_again: "🔄 Cumpără Din Nou",
  instagram_feed: "📸 Feed Instagram",
  reviews_section: "💬 Recenzii",
  brand_logos: "🏢 Logo-uri Branduri",
  recently_viewed: "👁️ Vizualizate Recent",
  newsletter_section: "📧 Newsletter",
  blog_section: "📝 Blog Preview",
};

const DEFAULT_ORDER = [
  "hero_section",
  "social_proof_bar",
  "quick_filters",
  "collections_grid",
  "coupon_collector",
  "flash_deals",
  "scent_guide_teaser",
  "featured_products",
  "top_vendors",
  "brand_story_section",
  "bestsellers_section",
  "buy_again",
  "instagram_feed",
  "reviews_section",
  "brand_logos",
  "recently_viewed",
  "newsletter_section",
];

export default function HomepageSectionOrder() {
  const [sections, setSections] = useState<string[]>(DEFAULT_ORDER);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    (supabase as any)
      .from("site_layout_settings")
      .select("value_json")
      .eq("setting_key", "homepage_section_order")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value_json && Array.isArray(data.value_json)) {
          setSections(data.value_json as string[]);
        }
        setLoading(false);
      });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      move(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => setDragIndex(null);

  const handleSave = async () => {
    setSaving(true);
    await (supabase as any)
      .from("site_layout_settings")
      .update({ value_json: sections, updated_at: new Date().toISOString() })
      .eq("setting_key", "homepage_section_order");
    toast.success("Ordinea secțiunilor salvată!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Se încarcă...
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutList className="w-5 h-5 text-primary" /> Ordinea Secțiunilor Homepage
        </CardTitle>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează Ordinea
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Trage secțiunile pentru a le reordona pe pagina principală. Modificările se aplică instant.
        </p>
        <div className="space-y-1">
          {sections.map((key, i) => (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
                dragIndex === i
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1">{SECTION_LABELS[key] || key}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-5 text-center">{i + 1}</span>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === sections.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
