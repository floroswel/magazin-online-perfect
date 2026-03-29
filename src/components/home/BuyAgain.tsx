import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export default function BuyAgain() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("order_items")
      .select("product_id, orders!inner(user_id)")
      .eq("orders.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const uniqueIds = [...new Set(data.map((d: any) => d.product_id))].slice(0, 8);
        supabase
          .from("products")
          .select("*")
          .in("id", uniqueIds)
          .eq("visible", true)
          .then(({ data: prods }) => {
            if (prods) setProducts(prods);
          });
      });
  }, [user]);

  if (!user || products.length === 0) return null;

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <RotateCcw className="w-5 h-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Cumpără din nou</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
