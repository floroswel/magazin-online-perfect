import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { usePageSeo } from "@/components/SeoHead";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const ITEMS_PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevanță" },
  { value: "price_asc", label: "Preț: Mic → Mare" },
  { value: "price_desc", label: "Preț: Mare → Mic" },
  { value: "newest", label: "Cele mai noi" },
  { value: "bestselling", label: "Cele mai vândute" },
  { value: "rating", label: "Rating" },
];

const COLLECTION_META: Record<string, { title: string; description: string }> = {
  "livrare-gratuita": { title: "🚚 Livrare Gratuită", description: "Produse cu transport gratuit inclus" },
  "lichidare-stoc": { title: "🔥 Lichidare Stoc", description: "Ultimele produse la prețuri reduse" },
  "ultimele-bucati": { title: "⏳ Ultimele Bucăți", description: "Stoc limitat — nu rata ocazia!" },
  "oferte-speciale": { title: "💰 Oferte Speciale", description: "Cele mai bune oferte din magazin" },
  "cadouri": { title: "🎁 Cadouri", description: "Produse ideale pentru cadouri" },
  "editie-limitata": { title: "💎 Ediție Limitată", description: "Produse exclusive, disponibile limitat" },
};

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const q = params.get("q") || "";
  const categorySlug = params.get("category") || "";
  const sale = params.get("sale") === "true";
  const freeShipping = params.get("free_shipping") === "true";
  const sort = params.get("sort") || "relevance";
  const page = parseInt(params.get("page") || "1", 10);

  // Detect collection from URL path or query param
  const PATH_COLLECTIONS: Record<string, string> = {
    "/lichidare-stoc": "lichidare-stoc",
    "/ultimele-bucati": "ultimele-bucati",
    "/transport-gratuit": "livrare-gratuita",
    "/oferte-speciale": "oferte-speciale",
    "/editie-limitata": "editie-limitata",
  };
  const collection = PATH_COLLECTIONS[location.pathname] || params.get("collection") || "";

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categorySlug ? [categorySlug] : []);
  const [stockFilter, setStockFilter] = useState<string>("in_stock");

  const collectionMeta = collection ? COLLECTION_META[collection] : null;

  usePageSeo({
    title: collectionMeta
      ? `${collectionMeta.title} | Mama Lucica`
      : q ? `Rezultate pentru "${q}" | Mama Lucica` : "Catalog Produse | Mama Lucica",
    description: collectionMeta?.description || "Descoperă toate produsele Mama Lucica. Livrare rapidă, prețuri competitive.",
  });

  useEffect(() => {
    if (categorySlug && !selectedCategories.includes(categorySlug)) {
      setSelectedCategories([categorySlug]);
    }
  }, [categorySlug]);

  const { data: categories } = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").eq("visible", true).order("display_order");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["catalog-products", q, selectedCategories, sale, freeShipping, collection, sort, page, priceRange, stockFilter],
    queryFn: async () => {
      let query = supabase.from("products").select("*, category:categories(slug, name)", { count: "exact" });

      // Search
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }

      // Category filter
      if (selectedCategories.length > 0 && categories) {
        const catIds = categories.filter(c => selectedCategories.includes(c.slug)).map(c => c.id);
        if (catIds.length > 0) query = query.in("category_id", catIds);
      }

      // Collection filter — manual tags + auto-rules
      if (collection) {
        if (collection === "ultimele-bucati") {
          // Auto-rule: stock 1-5 OR manually tagged
          query = query.or(`collections.cs.{ultimele-bucati},and(stock.gt.0,stock.lte.5)`);
        } else if (collection === "lichidare-stoc") {
          // Auto-rule: stock 1-3 OR manually tagged
          query = query.or(`collections.cs.{lichidare-stoc},and(stock.gt.0,stock.lte.3)`);
        } else if (collection === "livrare-gratuita") {
          // Auto-rule: price >= threshold OR manually tagged
          query = query.or(`collections.cs.{livrare-gratuita},price.gte.200`);
        } else {
          // Manual only
          query = query.contains("collections", [collection]);
        }
      }

      // Free shipping filter (standalone, not from collection)
      if (freeShipping && !collection) {
        query = query.gte("price", 200);
      }

      // Sale filter
      if (sale) {
        query = query.not("old_price", "is", null);
      }

      // Price filter
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      // Stock filter (skip if collection already handles stock)
      if (!collection && stockFilter === "in_stock") query = query.gt("stock", 0);

      // Sort
      switch (sort) {
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        case "bestselling": query = query.order("total_sold", { ascending: false, nullsFirst: false }); break;
        case "rating": query = query.order("rating", { ascending: false, nullsFirst: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, count } = await query;
      return { products: data || [], total: count || 0 };
    },
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const updateParam = (key: string, val: string) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val); else p.delete(key);
    if (key !== "page") p.set("page", "1");
    setParams(p);
  };

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (q) chips.push({ key: "q", label: `"${q}"` });
    selectedCategories.forEach(s => {
      const cat = categories?.find(c => c.slug === s);
      chips.push({ key: `cat-${s}`, label: `Categorie: ${cat?.name || s}` });
    });
    if (sale) chips.push({ key: "sale", label: "La reducere" });
    if (priceRange[0] > 0 || priceRange[1] < 500) chips.push({ key: "price", label: `Preț: ${priceRange[0]}-${priceRange[1]} lei` });
    return chips;
  }, [q, selectedCategories, sale, priceRange, categories]);

  const removeFilter = (key: string) => {
    if (key === "q") updateParam("q", "");
    else if (key === "sale") updateParam("sale", "");
    else if (key === "price") setPriceRange([0, 500]);
    else if (key.startsWith("cat-")) {
      const slug = key.replace("cat-", "");
      setSelectedCategories(prev => prev.filter(s => s !== slug));
      updateParam("category", "");
    }
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setPriceRange([0, 500]);
    setStockFilter("in_stock");
    setParams(new URLSearchParams());
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Filtre</h3>
        <button onClick={clearAll} className="text-xs text-destructive font-semibold hover:underline">Șterge tot</button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-[13px] font-bold text-foreground mb-2">Categorie</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {categories?.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-[13px] text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-[13px] font-bold text-foreground mb-2">Preț</h4>
        <Slider
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          min={0}
          max={500}
          step={10}
          className="mb-2"
        />
        <p className="text-xs text-muted-foreground">{priceRange[0]} lei — {priceRange[1]} lei</p>
      </div>

      {/* Stock */}
      <div>
        <h4 className="text-[13px] font-bold text-foreground mb-2">Disponibilitate</h4>
        <div className="space-y-1.5">
          {[
            { v: "in_stock", l: "În stoc" },
            { v: "all", l: "Include epuizate" },
          ].map(o => (
            <label key={o.v} className="flex items-center gap-2 cursor-pointer text-[13px] text-muted-foreground">
              <input type="radio" name="stock" checked={stockFilter === o.v} onChange={() => setStockFilter(o.v)} className="text-primary focus:ring-primary" />
              {o.l}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="ml-container py-3">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Acasă</Link>
          <span className="mx-1.5">/</span>
          {collectionMeta ? (
            <span className="text-foreground font-medium">{collectionMeta.title}</span>
          ) : (
            <span className="text-foreground font-medium">Catalog</span>
          )}
        </nav>
      </div>

      {/* Collection header */}
      {collectionMeta && (
        <div className="ml-container pb-4">
          <h1 className="text-2xl font-bold text-foreground">{collectionMeta.title}</h1>
          <p className="text-sm text-muted-foreground">{collectionMeta.description}</p>
        </div>
      )}

      <div className="ml-container pb-12">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-[52px] self-start">
            <div className="bg-card rounded-xl border border-border p-4">
              <FiltersContent />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs font-semibold">
                      <SlidersHorizontal className="h-4 w-4" /> Filtre
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-4">
                    <FiltersContent />
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground">
                  {q ? `Rezultate pentru "${q}"` : `${totalProducts} produse`}
                </p>
              </div>

              <select
                value={sort}
                onChange={e => updateParam("sort", e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-primary focus:border-primary"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map(f => (
                  <span key={f.key} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    {f.label}
                    <button onClick={() => removeFilter(f.key)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Product grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="aspect-square skeleton" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 skeleton rounded w-16" />
                      <div className="h-4 skeleton rounded w-full" />
                      <div className="h-5 skeleton rounded w-20" />
                      <div className="h-9 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-bold text-foreground mb-2">Nu am găsit produse</p>
                <p className="text-sm text-muted-foreground mb-4">Încearcă alte filtre sau caută altceva</p>
                <button onClick={clearAll} className="text-sm text-primary font-semibold hover:underline">Șterge toate filtrele</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  onClick={() => updateParam("page", String(Math.max(1, page - 1)))}
                  disabled={page <= 1}
                  className="h-9 px-3 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateParam("page", String(p))}
                      className={`h-9 w-9 rounded-lg text-sm font-medium ${
                        p === page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateParam("page", String(Math.min(totalPages, page + 1)))}
                  disabled={page >= totalPages}
                  className="h-9 px-3 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
