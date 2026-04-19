import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHead from "@/components/SeoHead";

export default function Favorites() {
  const { ids } = useFavorites();
  const idArr = Array.from(ids);

  const { data: products = [] } = useQuery({
    queryKey: ["fav-products", idArr.join(",")],
    queryFn: async () => {
      if (!idArr.length) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .in("id", idArr);
      return data || [];
    },
    enabled: idArr.length > 0,
  });

  return (
    <StorefrontLayout>
      <SeoHead title="Favoritele mele — Mama Lucica" description="Produsele tale favorite Mama Lucica." />
      <section className="ml-container py-6 lg:py-10">
        <nav className="text-xs text-muted-foreground mb-3"><Link to="/account" className="hover:text-accent">Cont</Link> / Favorite</nav>
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Favoritele mele</h1>
        {products.length === 0 ? (
          <div className="py-12 text-center bg-card border border-border rounded-md">
            <div className="text-4xl mb-2">💛</div>
            <p className="text-muted-foreground mb-4">Nu ai produse favorite încă.</p>
            <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Vezi produsele</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
