import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Star, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  cartProductIds: string[];
  cartCategoryIds: string[];
}

export default function CartRecommendations({ cartProductIds, cartCategoryIds }: Props) {
  const [interestProducts, setInterestProducts] = useState<Tables<"products">[]>([]);
  const [popularProducts, setPopularProducts] = useState<Tables<"products">[]>([]);
  const { addToCart } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    async function loadInterest() {
      if (cartCategoryIds.length === 0) return;
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("category_id", cartCategoryIds)
        .not("id", "in", `(${cartProductIds.join(",")})`)
        .eq("visible", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(4);
      setInterestProducts(data || []);
    }

    async function loadPopular() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .not("id", "in", `(${cartProductIds.join(",")})`)
        .eq("visible", true)
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(4);
      setPopularProducts(data || []);
    }

    if (cartProductIds.length > 0) {
      loadInterest();
      loadPopular();
    }
  }, [cartProductIds.join(","), cartCategoryIds.join(",")]);

  const handleQuickAdd = async (product: Tables<"products">) => {
    await addToCart(product.id, 1);
    toast.success(`${product.name} adăugat în coș!`);
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    products: Tables<"products">[]
  ) => {
    if (products.length === 0) return null;
    return (
      <section className="mt-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          {icon} {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-3 space-y-2">
                <Link to={`/product/${p.slug}`}>
                  <img
                    src={p.image_url || "/placeholder.svg"}
                    alt={p.name}
                    className="w-full h-24 object-contain rounded group-hover:scale-105 transition-transform"
                  />
                </Link>
                <Link
                  to={`/product/${p.slug}`}
                  className="text-xs font-medium line-clamp-2 hover:text-primary block"
                >
                  {p.name}
                </Link>
                {(p as any).rating_avg && (p as any).rating_avg > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">
                      {Number((p as any).rating_avg).toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">{format(p.price)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => handleQuickAdd(p)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adaugă
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  };

  return (
    <>
      {renderSection(
        "Te-ar mai putea interesa",
        <Sparkles className="h-5 w-5 text-primary" />,
        interestProducts
      )}
      {renderSection(
        "Cele mai populare produse",
        <TrendingUp className="h-5 w-5 text-primary" />,
        popularProducts
      )}
    </>
  );
}
