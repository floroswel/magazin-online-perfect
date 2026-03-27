import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Gift, Paintbrush, Wrench, Package, Zap } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Flame, Sparkles, Gift, Paintbrush, Wrench,
  "🕯️": Flame, "✨": Sparkles, "🎁": Gift, "🎨": Paintbrush, "🔧": Wrench,
};

interface Cat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  visible: boolean;
}

interface DynCat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  display_order: number;
}

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
      .then(({ data }) => setCategories((data as Cat[]) || []));

    supabase
      .from("dynamic_categories")
      .select("id, name, slug, icon, image_url, display_order")
      .eq("visible", true)
      .order("display_order")
      .then(({ data }) => setDynCategories((data || []) as unknown as DynCat[]));
  }, []);

  if (categories.length === 0 && dynCategories.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Cumpără pe categorii</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon || ""] || Package;
          return (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              )}
              <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.name}</span>
            </Link>
          );
        })}
        {dynCategories.map(dcat => (
          <Link
            key={`dyn-${dcat.id}`}
            to={`/catalog?smart=${dcat.slug}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-primary/30 hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {dcat.icon ? (
                <span className="text-2xl">{dcat.icon}</span>
              ) : (
                <Zap className="h-6 w-6 text-primary" />
              )}
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">{dcat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
