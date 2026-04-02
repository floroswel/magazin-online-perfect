import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  title?: string;
}

export default function BestSellers({ title = "Cele Mai Vândute" }: Props) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useScrollReveal();

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  return (
    <section className="container py-6 md:py-8 px-4" ref={ref}>
      <div className="flex items-center justify-between mb-4 reveal stagger-1">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {title}
        </h2>
        <Link to="/catalog?sort=popular" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
          Vezi toate <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 reveal stagger-2">
          {products.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
        </div>
      )}
    </section>
  );
}
