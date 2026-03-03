import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Tables<"brands">[]>([]);

  useEffect(() => {
    supabase
      .from("brands")
      .select("*")
      .order("name")
      .limit(20)
      .then(({ data }) => setBrands(data || []));
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Branduri populare</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {brands.map(brand => (
          <Link
            key={brand.id}
            to={`/catalog?search=${encodeURIComponent(brand.name)}`}
            className="flex-shrink-0 w-28 h-20 flex items-center justify-center rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all p-3"
          >
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-sm font-semibold text-foreground text-center">{brand.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
