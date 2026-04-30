import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight, Flame, Smartphone, Footprints, Home, Gift,
  Lightbulb, Sparkles, Package, Tv, Headphones, Shirt, Sofa,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
}

// Iconițe semantice pentru mega-hub mixt
const ICONS: Record<string, any> = {
  lumanari: Flame,
  "lumanari-pahar": Flame,
  "lumanari-pilar": Flame,
  electronice: Smartphone,
  telefoane: Smartphone,
  laptopuri: Tv,
  audio: Headphones,
  tv: Tv,
  incaltaminte: Footprints,
  pantofi: Footprints,
  haine: Shirt,
  casa: Home,
  "articole-casa": Home,
  mobilier: Sofa,
  decoratiuni: Sparkles,
  iluminat: Lightbulb,
  "seturi-cadou": Gift,
  default: Package,
};

const iconFor = (slug: string) => {
  const key = Object.keys(ICONS).find(k => slug?.includes(k));
  return ICONS[key || "default"] || Package;
};

export default function HomeCategorySidebar() {
  const [hovered, setHovered] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["sidebar-categories-mega"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, image_url")
        .eq("visible", true)
        .order("display_order")
        .order("name");
      return (data || []) as Category[];
    },
    staleTime: 5 * 60_000,
  });

  const roots = categories.filter(c => !c.parent_id);
  const subsOf = (id: string) => categories.filter(c => c.parent_id === id);

  if (!roots.length) return null;

  return (
    <aside
      className="hidden lg:block w-[260px] shrink-0 bg-white border border-border rounded-md shadow-sm relative"
      onMouseLeave={() => setHovered(null)}
    >
      {/* Header bar — visual hint that it's a permanent menu */}
      <div className="bg-secondary text-secondary-foreground px-4 py-3 flex items-center gap-2 rounded-t-md">
        <Package className="h-4 w-4" />
        <span className="text-[12px] font-bold uppercase tracking-wider">Toate Categoriile</span>
      </div>

      <ul className="py-1.5">
        {roots.map((cat) => {
          const Icon = iconFor(cat.slug);
          const subs = subsOf(cat.id);
          const isHovered = hovered === cat.id;
          return (
            <li
              key={cat.id}
              onMouseEnter={() => setHovered(cat.id)}
              className="relative"
            >
              <Link
                to={`/categorie/${cat.slug}`}
                className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors border-l-[3px] ${
                  isHovered
                    ? "bg-muted border-l-primary text-primary font-semibold"
                    : "border-l-transparent text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{cat.name}</span>
                {subs.length > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </Link>

              {/* Flyout cu subcategorii */}
              {isHovered && subs.length > 0 && (
                <div className="absolute left-full top-0 ml-px z-30 w-[480px] bg-white border border-border shadow-2xl rounded-md p-5 min-h-[200px]">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h4 className="text-sm font-bold text-foreground">{cat.name}</h4>
                    <Link
                      to={`/categorie/${cat.slug}`}
                      className="text-[11px] uppercase tracking-wider font-semibold text-primary hover:underline"
                    >
                      Vezi tot →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/categorie/${sub.slug}`}
                        className="text-[12.5px] text-muted-foreground hover:text-primary py-1 transition-colors truncate"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Footer banner promo */}
      <div className="border-t border-border px-4 py-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-b-md">
        <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Ofertă</p>
        <p className="text-xs font-semibold text-foreground mt-0.5">Transport gratuit &gt; 200 lei</p>
      </div>
    </aside>
  );
}
