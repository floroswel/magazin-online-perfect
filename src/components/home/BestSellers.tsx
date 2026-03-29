import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
          .limit(4)
          .then(({ data }) => setProducts(data || []));
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-14 md:py-20" ref={ref}>
      <div className="container px-4">
        <div className="text-center mb-10 reveal stagger-1">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 reveal stagger-2">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/catalog"
            className="inline-block font-sans text-[12px] font-medium tracking-[2px] uppercase border border-foreground text-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Vezi toate produsele
          </Link>
        </div>
      </div>
    </section>
  );
}
