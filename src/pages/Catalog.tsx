import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHead from "@/components/SeoHead";

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

export default function Catalog() {
  const { slug } = useParams<{ slug?: string }>();
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;

  const { data: category } = useQuery({
    queryKey: ["category-by-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await supabase.from("categories").select("id, name, slug, description, meta_title, meta_description").eq("slug", slug).maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog", slug, sort, page, category?.id],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .eq("status", "active")
        .eq("visible", true)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (slug && category?.id) q = q.eq("category_id", category.id);
      switch (sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "name": q = q.order("name", { ascending: true }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      const { data } = await q;
      return data || [];
    },
  });

  const title = category?.name || "Toate produsele";
  const seoTitle = category?.meta_title || `${title} — Mama Lucica`;
  const seoDesc = category?.meta_description || `Descoperă colecția ${title} Mama Lucica. Lumânări artizanale, livrare rapidă.`;

  return (
    <StorefrontLayout>
      <SeoHead title={seoTitle} description={seoDesc} />
      <section className="ml-container py-6 lg:py-10">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/" className="hover:text-accent">Acasă</Link>
          <span className="mx-2">/</span>
          {slug ? (
            <>
              <Link to="/catalog" className="hover:text-accent">Catalog</Link>
              <span className="mx-2">/</span>
              <span>{title}</span>
            </>
          ) : <span>Catalog</span>}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl">{title}</h1>
            {category?.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{category.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs text-muted-foreground">Sortare:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortKey); setPage(0); }}
              className="h-9 px-3 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent"
            >
              <option value="newest">Cele mai noi</option>
              <option value="price-asc">Preț crescător</option>
              <option value="price-desc">Preț descrescător</option>
              <option value="name">Alfabetic</option>
            </select>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-3">🕯️</div>
            <h2 className="font-display text-xl mb-2">Nu există produse</h2>
            <p className="text-sm text-muted-foreground">Revino mai târziu sau explorează alte categorii.</p>
            <Link to="/" className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-sm rounded-sm hover:opacity-90">Înapoi acasă</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} p={p as any} />)}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-border rounded-sm text-sm disabled:opacity-40">‹ Anterior</button>
              <span className="text-sm text-muted-foreground">Pagina {page + 1}</span>
              <button disabled={products.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-border rounded-sm text-sm disabled:opacity-40">Următor ›</button>
            </div>
          </>
        )}
      </section>
    </StorefrontLayout>
  );
}
