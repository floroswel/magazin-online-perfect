import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  productId: string;
  currentProduct: Tables<"products">;
}

export default function FrequentlyBoughtTogether({ productId, currentProduct }: Props) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const { addToCart } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    async function load() {
      const { data: rels } = await supabase
        .from("product_relations")
        .select("related_product_id")
        .eq("product_id", productId)
        .in("relation_type", ["frequently_bought", "cross_sell"])
        .eq("approved", true)
        .order("sort_order")
        .limit(4);

      if (!rels || rels.length === 0) return;
      const ids = rels.map(r => r.related_product_id);
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("visible", true);

      if (prods && prods.length > 0) {
        setProducts(prods);
        const initial: Record<string, boolean> = {};
        prods.forEach(p => { initial[p.id] = true; });
        setChecked(initial);
      }
    }
    load();
  }, [productId]);

  if (products.length === 0) return null;

  const selectedProducts = products.filter(p => checked[p.id]);
  const totalPrice = currentProduct.price + selectedProducts.reduce((s, p) => s + p.price, 0);

  const handleAddAll = async () => {
    await addToCart(currentProduct.id, 1);
    for (const p of selectedProducts) {
      await addToCart(p.id, 1);
    }
    // Track clicks
    for (const p of selectedProducts) {
      supabase.from("recommendation_clicks").insert({
        product_id: productId,
        recommended_product_id: p.id,
        recommendation_type: "frequently_bought",
      }).then(() => {});
    }
    toast.success(`${selectedProducts.length + 1} produse adăugate în coș!`);
  };

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-4">🛒 Cumpărate frecvent împreună</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Main product */}
            <div className="flex flex-col items-center w-28 shrink-0">
              <img src={currentProduct.image_url || "/placeholder.svg"} alt={currentProduct.name} className="w-20 h-20 object-contain rounded" />
              <p className="text-xs text-center mt-1 line-clamp-2 font-medium">{currentProduct.name}</p>
              <p className="text-sm font-bold text-primary">{format(currentProduct.price)}</p>
            </div>

            {products.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col items-center w-28 shrink-0">
                  <div className="relative">
                    <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-20 h-20 object-contain rounded" />
                    <div className="absolute -top-1 -left-1">
                      <Checkbox checked={checked[p.id] || false} onCheckedChange={() => toggle(p.id)} />
                    </div>
                  </div>
                  <Link to={`/product/${p.slug}`} className="text-xs text-center mt-1 line-clamp-2 hover:text-primary">{p.name}</Link>
                  <p className="text-sm font-bold text-primary">{format(p.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total pentru {selectedProducts.length + 1} produse:</p>
              <p className="text-xl font-bold text-primary">{format(totalPrice)}</p>
            </div>
            <Button onClick={handleAddAll} disabled={selectedProducts.length === 0} className="font-semibold">
              <ShoppingCart className="h-4 w-4 mr-2" /> Adaugă toate în coș
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
