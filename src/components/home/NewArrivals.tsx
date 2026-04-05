import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";

export default function NewArrivals() {
  const settings = useSettings();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["new-arrivals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Realtime: instantly refresh when products change
  useEffect(() => {
    const channel = supabase
      .channel("new-arrivals-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["new-arrivals"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const title = settings.new_arrivals_title || "🆕 Noutăți în Magazin";

  return (
    <section className="bg-secondary py-6">
      <div className="lumax-container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{title}</h2>
          <Link to="/catalog?sort=newest" className="text-primary text-[13px] font-medium hover:underline">
            Vezi toate noutățile →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
