import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Gift, Paintbrush, Package, Zap } from "lucide-react";
import { isCandleCollection } from "@/lib/candleCatalog";

const iconMap: Record<string, React.ElementType> = {
  Flame, Sparkles, Gift, Paintbrush,
  "🕯️": Flame, "✨": Sparkles, "🎁": Gift, "🎨": Paintbrush,
};

interface Cat { id: string; name: string; slug: string; icon: string | null; image_url: string | null; display_order: number; visible: boolean }
interface DynCat { id: string; name: string; slug: string; icon: string | null; image_url: string | null; display_order: number }

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [dynCategories, setDynCategories] = useState<DynCat[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug, icon, image_url, display_order, visible")
      .is("parent_id", null)
      .eq("visible", true)
      .order("display_order")
      .order("name")
      .then(({ data }) => {
        const filtered = ((data as Cat[]) || []).filter((cat) => isCandleCollection(cat));
        setCategories(filtered);
      });

    supabase
      .from("dynamic_categories")
      .select("id, name, slug, icon, image_url, display_order")
      .eq("visible", true)
      .order("display_order")
      .then(({ data }) => {
        const filtered = ((data || []) as unknown as DynCat[]).filter((cat) => isCandleCollection(cat));
        setDynCategories(filtered);
      });
  }, []);

  if (categories.length === 0 && dynCategories.length === 0) return null;

  return (
    <section className="container py-6 md:py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Explorează Categoriile</h2>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon || ""] || Package;
          return (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 p-4 bg-background border border-border hover:border-primary hover:shadow-sm transition-all rounded"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              )}
              <span className="text-xs font-semibold text-foreground text-center leading-tight">{cat.name}</span>
            </Link>
          );
        })}
        {dynCategories.map(dcat => (
          <Link
            key={`dyn-${dcat.id}`}
            to={`/catalog?smart=${dcat.slug}`}
            className="group flex flex-col items-center gap-2 p-4 bg-background border border-border hover:border-primary hover:shadow-sm transition-all rounded"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
              {dcat.icon ? (
                <span className="text-2xl">{dcat.icon}</span>
              ) : (
                <Zap className="h-6 w-6 text-primary" />
              )}
            </div>
            <span className="text-xs font-semibold text-foreground text-center leading-tight">{dcat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
