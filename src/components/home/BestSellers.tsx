import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function BestSellers({ title = "Cele Mai Iubite" }: { title?: string }) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").order("review_count", { ascending: false }).limit(8)
      .then(({ data }) => setProducts(data || []));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container py-16 md:py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-medium">Bestsellers</p>
          <h2 className="font-serif text-3xl font-medium text-foreground">{title}</h2>
        </div>
        <Link to="/catalog" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 tracking-wide transition-colors">
          Vezi toate <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
