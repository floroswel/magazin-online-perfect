import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Clock, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface VisitData {
  lastVisit: number;
  visitCount: number;
  lastViewedIds: string[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}

export default function WelcomeBack() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const { format } = useCurrency();
  const { addToCart } = useCart();

  useEffect(() => {
    const key = "ml_visit_data";
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let data: VisitData = raw
      ? JSON.parse(raw)
      : { lastVisit: 0, visitCount: 0, lastViewedIds: [] };

    const isNewVisit = now - data.lastVisit > 60 * 60 * 1000;
    if (isNewVisit) data.visitCount += 1;

    const recentIds: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
    if (recentIds.length > 0) data.lastViewedIds = recentIds.slice(0, 4);

    data.lastVisit = now;
    localStorage.setItem(key, JSON.stringify(data));
    setVisitCount(data.visitCount);

    if (data.visitCount >= 2 && data.lastViewedIds.length > 0) {
      supabase
        .from("products")
        .select("*")
        .in("id", data.lastViewedIds.slice(0, 3))
        .eq("visible", true)
        .then(({ data: prods }) => {
          if (prods && prods.length > 0) {
            // Preserve order
            const map = new Map(prods.map(p => [p.id, p]));
            setProducts(data.lastViewedIds.map(id => map.get(id)).filter(Boolean) as Tables<"products">[]);
          }
        });
    }
  }, []);

  if (visitCount < 2 || products.length === 0) return null;

  const handleQuickAdd = async (product: Tables<"products">) => {
    await addToCart(product.id, 1);
    toast.success(`${product.name} adăugat în coș!`);
  };

  return (
    <section className="container px-4 py-6">
      <div className="bg-gradient-to-r from-accent/40 to-accent/10 border border-accent rounded-xl p-5 md:p-6 space-y-4">
        {/* Greeting */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">👋</span>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {getGreeting()}! Bun revenit!
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Ai vizitat recent {products.length === 1 ? "acest produs" : "aceste produse"}:
            </p>
          </div>
        </div>

        {/* Recently viewed products */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 bg-card rounded-lg border p-3 hover:shadow-md transition-shadow group"
            >
              <Link to={`/product/${product.slug}`} className="shrink-0">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover group-hover:scale-105 transition-transform"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${product.slug}`}
                  className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-primary">{format(product.price)}</span>
                  {product.old_price && product.old_price > product.price && (
                    <span className="text-xs text-muted-foreground line-through">{format(product.old_price)}</span>
                  )}
                </div>
              </div>
              {product.stock > 0 && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleQuickAdd(product)}
                  title="Adaugă în coș"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Vizita ta #{visitCount}
          </p>
          <Link to="/catalog">
            <Button variant="link" size="sm" className="text-xs px-0">
              Continuă cumpărăturile →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
