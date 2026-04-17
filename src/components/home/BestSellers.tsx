import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";

export default function BestSellers() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["cat-tabs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("visible", true)
        .order("display_order")
        .limit(4);
      return data || [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["bestsellers", activeTab],
    queryFn: async () => {
      // First try products explicitly marked as bestseller
      let q = supabase
        .from("products")
        .select("*")
        .eq("badge_bestseller", true)
        .eq("status", "active")
        .order("total_sold", { ascending: false })
        .limit(10);
      if (activeTab) q = q.eq("category_id", activeTab);
      const { data: flagged } = await q;
      if (flagged && flagged.length > 0) return flagged;
      // Fallback: top sold products
      let q2 = supabase
        .from("products")
        .select("*")
        .order("total_sold", { ascending: false })
        .limit(10);
      if (activeTab) q2 = q2.eq("category_id", activeTab);
      const { data } = await q2;
      return data || [];
    },
  });

  // Realtime: instantly refresh when products change
  useEffect(() => {
    const channel = supabase
      .channel("bestsellers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["bestsellers"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const tabs = [{ id: null, name: "Toate" }, ...(categories || []).map((c) => ({ id: c.id, name: c.name }))];
  const title = settings.bestsellers_title || "⭐ Cele Mai Vândute";

  return (
    <section className="bg-card py-6">
      <div className="ml-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="section-title mb-0">{title}</h2>
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id ?? "all"}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {t.name}
              </button>
            ))}
            <Link to="/catalog" className="text-primary text-[13px] font-medium hover:underline whitespace-nowrap ml-2">
              Vezi toate →
            </Link>
          </div>
        </div>

        <div className={`grid gap-3 ${
          products && products.length <= 2
            ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 max-w-2xl"
            : products && products.length <= 4
            ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        }`}>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            : products?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
