import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import ProductCard from "@/components/products/ProductCard";

export default function NotFound() {
  usePageSeo({ title: "404 — Pagina nu a fost găsită | Mama Lucica", noindex: true });

  const { data: popular } = useQuery({
    queryKey: ["popular-404"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  return (
    <Layout>
      <div className="ml-container py-16 text-center">
        <p className="text-6xl mb-4">🕯️</p>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Ne pare rău, pagina nu a fost găsită</h1>
        <p className="text-muted-foreground mb-2">Se pare că această pagină s-a stins...</p>
        <p className="text-sm text-muted-foreground mb-8">Verifică adresa URL sau explorează produsele noastre.</p>
        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold text-sm hover:bg-ml-primary-dark transition-colors"
        >
          ← Înapoi la magazin
        </Link>

        {popular && popular.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold mb-4">Produse populare</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popular.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
