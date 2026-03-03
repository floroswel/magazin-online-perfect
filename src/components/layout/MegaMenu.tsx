import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Smartphone, Laptop, Tv, Refrigerator, Home, Shirt, Dumbbell, Gamepad2, Package, ChevronRight
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Smartphone, Laptop, Tv, Refrigerator, Home, Shirt, Dumbbell, Gamepad2
};

export default function MegaMenu() {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <nav className="bg-card border-b shadow-sm relative">
      <div className="container">
        <ul className="hidden md:flex items-center gap-0.5 py-1 overflow-x-auto">
          {parents.map(cat => {
            const Icon = iconMap[cat.icon || ""] || Package;
            const children = getChildren(cat.id);
            return (
              <li
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <Link
                  to={`/catalog?category=${cat.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary rounded-md hover:bg-muted transition-colors whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
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
        </ul>
      </div>
    </nav>
  );
}
