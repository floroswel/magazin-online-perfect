import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import type { Tables } from "@/integrations/supabase/types";

export default function PersonalizedRecommendations() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const { user } = useAuth();
  const { items: cartItems } = useCart();

  useEffect(() => {
    async function load() {
      const cartProductIds = cartItems.map((i: any) => i.product_id || i.id).filter(Boolean);

      if (user) {
        // Logged-in user: recommend based on order history categories
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, products(category_id)")
          .eq("orders.user_id" as any, user.id)
          .limit(30);

        const categoryIds = new Set<string>();
        const purchasedIds = new Set<string>();

        (orderItems || []).forEach((item: any) => {
          if (item.product_id) purchasedIds.add(item.product_id);
          if (item.products?.category_id) categoryIds.add(item.products.category_id);
        });

        // Also use viewed categories from localStorage
        const catMap: Record<string, string> = JSON.parse(localStorage.getItem("viewed_categories") || "{}");
        Object.values(catMap).forEach(c => categoryIds.add(c));

        if (categoryIds.size > 0) {
          const excludeIds = [...purchasedIds, ...cartProductIds];
          let query = supabase
            .from("products")
            .select("*")
            .in("category_id", [...categoryIds])
            .eq("visible", true)
            .gt("stock", 0)
            .order("total_sold", { ascending: false })
            .limit(12);

          if (excludeIds.length > 0) {
            query = query.not("id", "in", `(${excludeIds.slice(0, 20).join(",")})`);
          }

          const { data } = await query;
          if (data && data.length > 0) {
            setProducts(data.slice(0, 8));
            return;
          }
        }
      }

      // Guest or no order history: show most popular products
      const viewedIds: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      const excludeIds = [...viewedIds, ...cartProductIds];

      let query = supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(12);

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.slice(0, 20).join(",")})`);
      }

      const { data } = await query;
      setProducts((data || []).slice(0, 8));
    }

    load();
  }, [user, cartItems]);

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
        {user ? "Pe baza comenzilor și preferințelor tale" : "Cele mai populare produse"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
