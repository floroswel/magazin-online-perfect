import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Smartphone, Laptop, Tv, Refrigerator, Home, Shirt, Dumbbell, Gamepad2, Package
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Smartphone, Laptop, Tv, Refrigerator, Home, Shirt, Dumbbell, Gamepad2
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  if (categories.length === 0) return null;

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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
