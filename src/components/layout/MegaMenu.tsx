import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Sparkles, Gift, Paintbrush, Wrench, Package, ChevronRight, Zap
} from "lucide-react";
import { isCandleCollection } from "@/lib/candleCatalog";

const iconMap: Record<string, React.ElementType> = {
  Flame, Sparkles, Gift, Paintbrush, Wrench,
  "🕯️": Flame, "✨": Sparkles, "🎁": Gift, "🎨": Paintbrush, "🔧": Wrench,
};

interface Cat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  show_in_nav: boolean;
  display_order: number;
}

interface DynCat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
}

export default function MegaMenu() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [dynCategories, setDynCategories] = useState<DynCat[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug, icon, parent_id, show_in_nav, display_order")
      .eq("visible", true)
      .order("display_order")
      .order("name")
      .then(({ data }) =>
        setCategories(((data as Cat[]) || []).filter((cat) => isCandleCollection(cat)))
      );

    supabase
      .from("dynamic_categories")
      .select("id, name, slug, icon, display_order")
      .eq("visible", true)
      .order("display_order")
      .then(({ data }) =>
        setDynCategories(((data || []) as unknown as DynCat[]).filter((cat) => isCandleCollection(cat)))
      );
  }, []);

  // Only show categories marked as show_in_nav
  const navCategories = categories.filter(c => c.show_in_nav !== false && isCandleCollection(c));
  const parents = navCategories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => navCategories.filter(c => c.parent_id === parentId);

  return (
    <nav className="bg-white border-b-2 border-primary/20 shadow-sm relative">
      <div className="container">
        <ul className="hidden md:flex items-center gap-0 py-0 overflow-x-auto">
          {parents.map(cat => {
            const Icon = iconMap[cat.icon || ""] || Package;
            const children = getChildren(cat.id);
            const catLink = cat.slug.includes("personalizat") ? "/personalizare" : `/catalog?category=${cat.slug}`;
            return (
              <li
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <Link
                  to={catLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {cat.name}
                  {children.length > 0 && <ChevronRight className="h-3 w-3 ml-0.5 opacity-50" />}
                </Link>
                {children.length > 0 && hoveredCat === cat.id && (
                  <div className="absolute left-0 top-full z-50 bg-card border border-border rounded-lg shadow-xl p-4 min-w-[200px] animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {children.map(child => (
                      <Link
                        key={child.id}
                        to={`/catalog?category=${child.slug}`}
                        className="block px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {dynCategories.map(dcat => (
            <li key={`dyn-${dcat.slug}`}>
              <Link
                to={`/catalog?smart=${dcat.slug}`}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all whitespace-nowrap"
              >
                {dcat.icon ? <span className="text-base">{dcat.icon}</span> : <Zap className="h-4 w-4 text-primary" />}
                {dcat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
