import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isCandleCollection } from "@/lib/candleCatalog";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function BestSellers({ title = "Cele mai vândute" }: { title?: string }) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const ref = useScrollReveal();

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("visible", true)
      .then(({ data: cats }) => {
        const ids = ((cats || []) as Array<{ id: string; name: string; slug: string }>)
          .filter((cat) => isCandleCollection(cat))
          .map((cat) => cat.id);
        if (ids.length === 0) { setProducts([]); return; }
        supabase
          .from("products")
          .select("*")
          .in("category_id", ids)
          .order("review_count", { ascending: false })
          .limit(8)
          .then(({ data }) => setProducts(data || []));
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-foreground py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="flex items-end justify-between mb-10 reveal stagger-1">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-background">{title}</h2>
          </div>
          <Link to="/catalog" className="font-sans text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors">
            Vezi toate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal stagger-2">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
