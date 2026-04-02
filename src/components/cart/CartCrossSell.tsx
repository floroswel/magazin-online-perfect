import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  cartProductIds: string[];
}

export default function CartCrossSell({ cartProductIds }: Props) {
  const [suggestions, setSuggestions] = useState<Tables<"products">[]>([]);
  const { addToCart } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    if (cartProductIds.length === 0) return;
    async function load() {
      // Get cross-sell relations for cart items
      const { data: rels } = await supabase
        .from("product_relations")
        .select("related_product_id, product_id")
        .in("product_id", cartProductIds)
        .in("relation_type", ["cross_sell", "frequently_bought", "accessory"])
        .eq("approved", true)
        .limit(12);

      if (!rels || rels.length === 0) return;

      // Filter out products already in cart
      const relIds = [...new Set(rels.map(r => r.related_product_id))].filter(id => !cartProductIds.includes(id));
      if (relIds.length === 0) return;

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .in("id", relIds.slice(0, 4))
        .eq("visible", true)
        .gt("stock", 0);

      setSuggestions(prods || []);
    }
    load();
  }, [cartProductIds.join(",")]);

  if (suggestions.length === 0) return null;

  const handleQuickAdd = async (product: Tables<"products">) => {
    await addToCart(product.id, 1);
    // Track click
    supabase.from("recommendation_clicks").insert({
      product_id: cartProductIds[0],
      recommended_product_id: product.id,
      recommendation_type: "cross_sell",
    }).then(() => {});
    toast.success(`${product.name} adăugat în coș!`);
  };

  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold mb-3">💡 Ți-ar putea plăcea</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {suggestions.map(p => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <Link to={`/product/${p.slug}`}>
                <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-full h-24 object-contain rounded" />
              </Link>
              <Link to={`/product/${p.slug}`} className="text-xs font-medium line-clamp-2 hover:text-primary block">{p.name}</Link>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary">{format(p.price)}</p>
                <Button size="sm" className="h-9 text-sm px-3 font-bold" onClick={() => handleQuickAdd(p)}>
                  <Plus className="h-4 w-4 mr-1" /> Adaugă
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
