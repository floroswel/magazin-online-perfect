import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHead from "@/components/SeoHead";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() || "";

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q) return [];
      const { data } = await (supabase as any).rpc("search_products", { search_term: q, result_limit: 60 });
      return data || [];
    },
    enabled: q.length > 0,
  });

  return (
    <StorefrontLayout>
      <SeoHead title={`Căutare "${q}" — Mama Lucica`} description={`Rezultate pentru "${q}" în catalogul Mama Lucica.`} />
      <section className="ml-container py-6 lg:py-10">
        <h1 className="font-display text-2xl lg:text-3xl mb-2">Rezultate pentru „{q}"</h1>
        <p className="text-sm text-muted-foreground mb-6">{isLoading ? "Caut..." : `${results.length} produse găsite`}</p>

        {!q ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Introdu un termen de căutare în bara de sus.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-md" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="font-display text-xl mb-2">Niciun rezultat</h2>
            <p className="text-sm text-muted-foreground mb-4">Încearcă alți termeni sau explorează catalogul.</p>
            <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Vezi catalogul</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((p: any) => (
              <ProductCard key={p.id} p={{ ...p, stock: 1 }} />
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
