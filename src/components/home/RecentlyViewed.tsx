import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isCandleCollection } from "@/lib/candleCatalog";

export default function RecentlyViewed() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
    if (ids.length === 0) return;

    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("visible", true)
      .then(({ data: cats }) => {
        const allowedCategoryIds = ((cats || []) as Array<{ id: string; name: string; slug: string }>).filter((cat) =>
          isCandleCollection(cat)
        ).map((cat) => cat.id);

        if (allowedCategoryIds.length === 0) {
          setProducts([]);
          return;
        }

        supabase
          .from("products")
          .select("*")
          .in("id", ids.slice(0, 8))
          .in("category_id", allowedCategoryIds)
          .then(({ data }) => {
            if (data) {
              const map = new Map(data.map(p => [p.id, p]));
              setProducts(ids.map(id => map.get(id)).filter(Boolean) as Tables<"products">[]);
            }
          });
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Vizualizate recent</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
