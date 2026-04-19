import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHead from "@/components/SeoHead";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

const PAGE_SIZE = 24;

export default function Catalog() {
  const { slug } = useParams<{ slug?: string }>();
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);

  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 1000]);
  const [selectedWeights, setSelectedWeights] = useState<number[]>([]);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Reset pagination when filters change
  useEffect(() => { setPage(0); }, [sort, priceRange, selectedWeights, selectedContainers, selectedCategories, slug]);

  const { data: category } = useQuery({
    queryKey: ["category-by-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await supabase.from("categories").select("id, name, slug, description, meta_title, meta_description").eq("slug", slug).maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  // Load filter facets (all distinct values from active products)
  const { data: facets } = useQuery({
    queryKey: ["catalog-facets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("price, weight_g, container_type, category_id")
        .eq("status", "active")
        .eq("visible", true);
      const rows = data || [];
      const prices = rows.map((r: any) => Number(r.price)).filter((n) => !isNaN(n) && n > 0);
      const minP = prices.length ? Math.floor(Math.min(...prices)) : 0;
      const maxP = prices.length ? Math.ceil(Math.max(...prices)) : 1000;
      const weights = Array.from(new Set(rows.map((r: any) => r.weight_g).filter((w: any) => w))).sort((a: any, b: any) => a - b) as number[];
      const containers = Array.from(new Set(rows.map((r: any) => r.container_type).filter(Boolean))) as string[];
      const catIds = Array.from(new Set(rows.map((r: any) => r.category_id).filter(Boolean))) as string[];
      let cats: { id: string; name: string; slug: string }[] = [];
      if (catIds.length) {
        const { data: c } = await supabase.from("categories").select("id, name, slug").in("id", catIds).order("name");
        cats = c || [];
      }
      return { minP, maxP, weights, containers, cats };
    },
  });

  // Initialize price bounds from facets once
  useEffect(() => {
    if (facets && (priceBounds[0] !== facets.minP || priceBounds[1] !== facets.maxP)) {
      setPriceBounds([facets.minP, facets.maxP]);
      setPriceRange([facets.minP, facets.maxP]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facets?.minP, facets?.maxP]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog", slug, sort, page, category?.id, priceRange, selectedWeights, selectedContainers, selectedCategories],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .eq("status", "active")
        .eq("visible", true);

      if (slug && category?.id) q = q.eq("category_id", category.id);
      else if (selectedCategories.length) q = q.in("category_id", selectedCategories);

      if (priceRange[0] > priceBounds[0]) q = q.gte("price", priceRange[0]);
      if (priceRange[1] < priceBounds[1]) q = q.lte("price", priceRange[1]);
      if (selectedWeights.length) q = q.in("weight_g", selectedWeights);
      if (selectedContainers.length) q = q.in("container_type", selectedContainers);

      switch (sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "name": q = q.order("name", { ascending: true }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data } = await q;
      return data || [];
    },
  });

  const title = category?.name || "Toate produsele";
  const seoTitle = category?.meta_title || `${title} — Mama Lucica`;
  const seoDesc = category?.meta_description || `Descoperă colecția ${title}. Lumânări artizanale, livrare rapidă.`;

  const activeFiltersCount =
    (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1] ? 1 : 0) +
    selectedWeights.length + selectedContainers.length + selectedCategories.length;

  const resetFilters = () => {
    setPriceRange(priceBounds);
    setSelectedWeights([]);
    setSelectedContainers([]);
    setSelectedCategories([]);
  };

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Categorii */}
      {!slug && facets?.cats && facets.cats.length > 0 && (
        <FilterGroup title="Categorie">
          <div className="space-y-2">
            {facets.cats.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedCategories.includes(c.id)}
                  onCheckedChange={(v) =>
                    setSelectedCategories((prev) => v ? [...prev, c.id] : prev.filter((x) => x !== c.id))
                  }
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Preț */}
      <FilterGroup title="Preț">
        <div className="px-1 pt-2">
          <Slider
            min={priceBounds[0]}
            max={priceBounds[1]}
            step={1}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
          />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{priceRange[0]} lei</span>
            <span>{priceRange[1]} lei</span>
          </div>
        </div>
      </FilterGroup>

      {/* Gramaj */}
      {facets && facets.weights.length > 0 && (
        <FilterGroup title="Gramaj">
          <div className="flex flex-wrap gap-2">
            {facets.weights.map((w) => {
              const active = selectedWeights.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeights((prev) => active ? prev.filter((x) => x !== w) : [...prev, w])}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"}`}
                >
                  {w}g
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Recipient */}
      {facets && facets.containers.length > 0 && (
        <FilterGroup title="Tip recipient">
          <div className="space-y-2">
            {facets.containers.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                <Checkbox
                  checked={selectedContainers.includes(c)}
                  onCheckedChange={(v) =>
                    setSelectedContainers((prev) => v ? [...prev, c] : prev.filter((x) => x !== c))
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={resetFilters}>
          <X className="w-4 h-4 mr-1" /> Șterge filtre ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

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
          ) : <span>Toate produsele</span>}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl">{title}</h1>
            {category?.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{category.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filters trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  Filtre {activeFiltersCount > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[10px] w-5 h-5 inline-flex items-center justify-center">{activeFiltersCount}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                <SheetHeader><SheetTitle>Filtre</SheetTitle></SheetHeader>
                <div className="mt-4">{FiltersPanel}</div>
              </SheetContent>
            </Sheet>
            <label htmlFor="sort" className="sr-only">Sortare</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 px-3 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent"
            >
              <option value="newest">Cele mai noi</option>
              <option value="price-asc">Preț ↑</option>
              <option value="price-desc">Preț ↓</option>
              <option value="name">Alfabetic</option>
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">{FiltersPanel}</div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border rounded-md">
                <div className="text-5xl mb-3">🕯️</div>
                <h2 className="font-display text-xl mb-2">Nu există produse</h2>
                <p className="text-sm text-muted-foreground">Încearcă să ajustezi filtrele sau revino mai târziu.</p>
                {activeFiltersCount > 0 && (
                  <Button onClick={resetFilters} className="mt-4">Șterge toate filtrele</Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((p) => <ProductCard key={p.id} p={p as any} />)}
                </div>
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-border rounded-sm text-sm disabled:opacity-40">‹ Anterior</button>
                  <span className="text-sm text-muted-foreground">Pagina {page + 1}</span>
                  <button disabled={products.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-border rounded-sm text-sm disabled:opacity-40">Următor ›</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
