import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function PersonalizedRecommendations() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    async function load() {
      // Get viewed product IDs to exclude
      const viewedIds: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      if (viewedIds.length === 0) return;

      // Get category mapping from browsing history
      const catMap: Record<string, string> = JSON.parse(localStorage.getItem("viewed_categories") || "{}");
      const categoryIds = [...new Set(Object.values(catMap))];

      if (categoryIds.length === 0) return;

      // Fetch products from same categories, excluding already viewed
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("category_id", categoryIds)
        .not("id", "in", `(${viewedIds.slice(0, 20).join(",")})`)
        .eq("visible", true)
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(8);

      setProducts(data || []);
    }

    load();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Recomandate pentru tine
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4 -mt-3">
        Pe baza produselor pe care le-ai vizualizat recent
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
