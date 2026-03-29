import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  title?: string;
}

export default function FlashDeals({ title = "⚡ Flash Deals" }: Props) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useScrollReveal();

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = Math.max(0, endOfDay.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .not("old_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  return (
    <section className="bg-card border-y border-border" ref={ref}>
      <div className="container py-6 md:py-10 px-4">
        <div className="flex items-center justify-between mb-5 reveal stagger-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span className="font-bold text-sm">{title}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Se termină în:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.h).padStart(2, "0")}</span>
              <span className="font-bold text-foreground">:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.m).padStart(2, "0")}</span>
              <span className="font-bold text-foreground">:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.s).padStart(2, "0")}</span>
            </div>
          </div>
          <Link to="/catalog?badge=deals" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Vezi toate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 reveal stagger-2">
            {products.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
          </div>
        )}
      </div>
    </section>
  );
}
