import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  productId: string;
  currentProduct: Tables<"products">;
}

export default function UpgradeRecommendation({ productId, currentProduct }: Props) {
  const [upsellProduct, setUpsellProduct] = useState<Tables<"products"> | null>(null);
  const { addToCart } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    async function load() {
      const { data: rel } = await supabase
        .from("product_relations")
        .select("related_product_id")
        .eq("product_id", productId)
        .eq("relation_type", "upsell")
        .eq("approved", true)
        .limit(1)
        .maybeSingle();

      if (!rel) return;
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("id", rel.related_product_id)
        .eq("visible", true)
        .maybeSingle();

      if (prod) setUpsellProduct(prod);
    }
    load();
  }, [productId]);

  if (!upsellProduct) return null;

  const priceDiff = upsellProduct.price - currentProduct.price;

  const handleChoose = async () => {
    await addToCart(upsellProduct.id, 1);
    supabase.from("recommendation_clicks").insert({
      product_id: productId,
      recommended_product_id: upsellProduct.id,
      recommendation_type: "upsell",
    }).then(() => {});
    toast.success("Varianta premium adăugată în coș!");
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" /> Upgrade Recomandat
      </h2>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Clienții aleg adesea varianta premium</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Current */}
            <div className="text-center space-y-2 opacity-70">
              <img src={currentProduct.image_url || "/placeholder.svg"} alt={currentProduct.name} className="w-24 h-24 object-contain mx-auto rounded" />
              <p className="text-sm font-medium line-clamp-2">{currentProduct.name}</p>
              <p className="text-lg font-bold">{format(currentProduct.price)}</p>
              <Badge variant="secondary">Produsul curent</Badge>
            </div>

            {/* Upsell */}
            <div className="text-center space-y-2 relative">
              <Badge className="absolute -top-2 right-0 bg-primary text-primary-foreground text-[10px]">Recomandat</Badge>
              <img src={upsellProduct.image_url || "/placeholder.svg"} alt={upsellProduct.name} className="w-24 h-24 object-contain mx-auto rounded" />
              <Link to={`/product/${upsellProduct.slug}`} className="text-sm font-medium line-clamp-2 hover:text-primary block">{upsellProduct.name}</Link>
              <p className="text-lg font-bold text-primary">{format(upsellProduct.price)}</p>
              {priceDiff > 0 && (
                <p className="text-xs text-muted-foreground">+{format(priceDiff)} diferență</p>
              )}
            </div>
          </div>
          <Button onClick={handleChoose} size="lg" className="w-full mt-4 font-extrabold text-base uppercase tracking-wide">
            <ArrowRight className="h-5 w-5 mr-2" /> Alege varianta premium
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
