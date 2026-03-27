import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Gift, Paintbrush, Package, Zap } from "lucide-react";

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
    supabase.from("categories").select("id, name, slug, icon, image_url, display_order, visible").is("parent_id", null).eq("visible", true).order("display_order").order("name").then(({ data }) => setCategories((data as Cat[]) || []));
    supabase.from("dynamic_categories").select("id, name, slug, icon, image_url, display_order").eq("visible", true).order("display_order").then(({ data }) => setDynCategories((data || []) as unknown as DynCat[]));
  }, []);

  if (categories.length === 0 && dynCategories.length === 0) return null;

  return (
    <section className="container py-16 md:py-20">
      <div className="text-center mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Colecții</p>
        <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground">Explorează Lumânările Noastre</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon || ""] || Package;
          return (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group relative flex flex-col items-center gap-4 p-6 md:p-8 border border-border hover:border-primary transition-all duration-300"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-16 h-16 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground text-center tracking-wide">{cat.name}</span>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-12 h-[2px] bg-primary transition-all duration-300" />
            </Link>
          );
        })}
        {dynCategories.map(dcat => (
          <Link
            key={`dyn-${dcat.id}`}
            to={`/catalog?smart=${dcat.slug}`}
            className="group relative flex flex-col items-center gap-4 p-6 md:p-8 border border-primary/20 hover:border-primary transition-all duration-300"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              {dcat.icon ? (
                <span className="text-3xl">{dcat.icon}</span>
              ) : (
                <Zap className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground text-center tracking-wide">{dcat.name}</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-12 h-[2px] bg-primary transition-all duration-300" />
          </Link>
        ))}
      </div>
    </section>
  );
}
