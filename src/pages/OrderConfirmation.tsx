import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { usePageSeo } from "@/components/SeoHead";
import type { Tables } from "@/integrations/supabase/types";

export default function OrderConfirmation() {
  usePageSeo({ title: "Confirmare Comandă — MamaLucica", description: "Comanda ta a fost plasată cu succes.", noindex: true });
  const { orderId } = useParams();
  const { format } = useCurrency();
  const { addToCart } = useCart();
  const [recommendations, setRecommendations] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    if (!orderId) return;
    async function loadRecommendations() {
      // Get order items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", orderId);

      if (!orderItems || orderItems.length === 0) return;

      const productIds = orderItems.map(oi => oi.product_id);

      // Get cross-sell/related products
      const { data: rels } = await supabase
        .from("product_relations")
        .select("related_product_id")
        .in("product_id", productIds)
        .in("relation_type", ["cross_sell", "frequently_bought", "accessory"])
        .eq("approved", true)
        .limit(8);

      if (!rels || rels.length === 0) return;

      const relIds = [...new Set(rels.map(r => r.related_product_id))].filter(id => !productIds.includes(id));
      if (relIds.length === 0) return;

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .in("id", relIds.slice(0, 4))
        .eq("visible", true)
        .gt("stock", 0);

      setRecommendations(prods || []);
    }
    loadRecommendations();
  }, [orderId]);

  const handleAddToCart = async (product: Tables<"products">) => {
    await addToCart(product.id, 1);
    supabase.from("recommendation_clicks").insert({
      product_id: product.id,
      recommended_product_id: product.id,
      recommendation_type: "post_purchase",
    }).then(() => {});
    toast.success(`${product.name} adăugat în coș!`);
  };

  return (
    <Layout>
      <div className="container py-16 text-center max-w-2xl mx-auto">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Comanda a fost plasată!</h1>
        <p className="text-muted-foreground mb-2">Mulțumim pentru comandă. Vei primi un email de confirmare.</p>
        <p className="text-sm text-muted-foreground mb-6">ID Comandă: <span className="font-mono">{orderId}</span></p>
        <div className="flex gap-3 justify-center mb-8">
          <Link to="/account"><Button variant="outline">Comenzile mele</Button></Link>
          <Link to="/"><Button>Continuă cumpărăturile</Button></Link>
        </div>

        {/* Post-purchase recommendations */}
        {recommendations.length > 0 && (
          <div className="text-left mt-8">
            <h2 className="text-xl font-bold mb-4">Clienții care au cumpărat asta au mai luat și...</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recommendations.map(p => (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <Link to={`/product/${p.slug}`}>
                      <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="w-full h-24 object-contain rounded" />
                    </Link>
                    <Link to={`/product/${p.slug}`} className="text-xs font-medium line-clamp-2 hover:text-primary block">{p.name}</Link>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-primary">{format(p.price)}</p>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleAddToCart(p)}>
                        <Plus className="h-3 w-3 mr-1" /> Adaugă
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
