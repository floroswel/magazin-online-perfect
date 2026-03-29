import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function RecentlyViewed() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
    if (ids.length === 0) return;

    supabase
      .from("products")
      .select("*")
      .in("id", ids.slice(0, 8))
      .eq("visible", true)
      .then(({ data }) => {
        if (data) {
          // Preserve order from localStorage
          const map = new Map(data.map(p => [p.id, p]));
          setProducts(ids.map(id => map.get(id)).filter(Boolean) as Tables<"products">[]);
        }
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">👁️ Vizualizate Recent</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
