import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function BestSellers({ title = "Cele mai vândute" }: { title?: string }) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("review_count", { ascending: false })
      .limit(8)
      .then(({ data }) => setProducts(data || []));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Cele mai vândute</h2>
        </div>
        <Link to="/catalog" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
          Vezi toate <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
