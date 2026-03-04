import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search");

  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [brands, setBrands] = useState<Tables<"brands">[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(24);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
    supabase.from("brands").select("*").order("name").then(({ data }) => setBrands(data || []));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySlug, searchQuery, sort, priceRange, selectedBrands, inStockOnly, selectedRatings]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from("products").select("*", { count: "exact" });

      if (categorySlug) {
        const cat = categories.find(c => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      if (inStockOnly) {
        query = query.gt("stock", 0);
      }

      switch (sort) {
        case "price-asc": query = query.order("price", { ascending: true }); break;
        case "price-desc": query = query.order("price", { ascending: false }); break;
        case "rating": query = query.order("rating", { ascending: false }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        default: query = query.order("review_count", { ascending: false }); break;
      }

      const from = (currentPage - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      const { data, count } = await query;
      let filtered = data || [];
      if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand));
      }
      if (selectedRatings.length > 0) {
        filtered = filtered.filter(p => {
          const r = Math.round(p.rating || 0);
          return selectedRatings.some(sr => r >= sr);
        });
      }
      setProducts(filtered);
      setTotalCount(count || 0);
      setLoading(false);
    }
    load();
  }, [categorySlug, searchQuery, sort, priceRange, selectedBrands, inStockOnly, selectedRatings, categories, currentPage, perPage]);

  const totalPages = Math.ceil(totalCount / perPage);
  const currentCategory = categories.find(c => c.slug === categorySlug);

  const activeFiltersCount = [
    selectedBrands.length > 0,
    inStockOnly,
    selectedRatings.length > 0,
    priceRange[0] > 0 || priceRange[1] < 10000,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedBrands([]);
    setInStockOnly(false);
    setSelectedRatings([]);
    setPriceRange([0, 10000]);
  };

  // Extract specs keys for dynamic attribute filters
  const specKeys = useMemo(() => {
    const keyCount: Record<string, number> = {};
    products.forEach(p => {
      if (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)) {
        Object.keys(p.specs as Record<string, unknown>).forEach(k => {
          keyCount[k] = (keyCount[k] || 0) + 1;
        });
      }
    });
    // Only show attributes present in >10% of products
    return Object.entries(keyCount)
      .filter(([, count]) => count >= Math.max(2, products.length * 0.1))
      .map(([key]) => key)
      .slice(0, 5);
  }, [products]);

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});

  const filteredBySpecs = useMemo(() => {
    const activeSpecs = Object.entries(selectedSpecs).filter(([, vals]) => vals.length > 0);
    if (activeSpecs.length === 0) return products;
    return products.filter(p => {
      if (!p.specs || typeof p.specs !== "object") return false;
      const specs = p.specs as Record<string, unknown>;
      return activeSpecs.every(([key, vals]) => vals.includes(String(specs[key] || "")));
    });
  }, [products, selectedSpecs]);

  const specValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    specKeys.forEach(key => {
      const vals = new Set<string>();
      products.forEach(p => {
        if (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)) {
          const v = (p.specs as Record<string, unknown>)[key];
          if (v != null) vals.add(String(v));
        }
      });
      result[key] = [...vals].sort();
    });
    return result;
  }, [products, specKeys]);

  const toggleSpec = (key: string, val: string) => {
    setSelectedSpecs(prev => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(val) ? current.filter(v => v !== val) : [...current, val],
      };
    });
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {searchQuery ? `Rezultate pentru "${searchQuery}"` : currentCategory?.name || "Toate produsele"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} produse găsite</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="md:hidden relative" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtre
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Cele mai populare</SelectItem>
                <SelectItem value="price-asc">Preț crescător</SelectItem>
                <SelectItem value="price-desc">Preț descrescător</SelectItem>
                <SelectItem value="rating">Cele mai bine evaluate</SelectItem>
                <SelectItem value="newest">Cele mai noi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-card p-6 overflow-y-auto" : "hidden"} md:block md:static md:w-64 flex-shrink-0 space-y-5`}>
            <div className="flex items-center justify-between md:hidden">
              <h2 className="text-lg font-bold">Filtre</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={clearFilters}>
                Resetează filtrele ({activeFiltersCount})
              </Button>
            )}

            {/* Price filter */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground text-sm">Preț</h3>
              <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={10000} step={100} className="mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{priceRange[0]} lei</span>
                <span>{priceRange[1]} lei</span>
              </div>
            </div>

            {/* In stock */}
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={inStockOnly} onCheckedChange={(v) => setInStockOnly(!!v)} />
                <span className="text-foreground font-medium">Doar în stoc</span>
              </label>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground text-sm">Rating minim</h3>
              <div className="space-y-1.5">
                {[4, 3, 2].map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedRatings.includes(r)}
                      onCheckedChange={(checked) => {
                        setSelectedRatings(prev => checked ? [...prev, r] : prev.filter(x => x !== r));
                      }}
                    />
                    <span className="text-muted-foreground">{"⭐".repeat(r)} & peste</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground text-sm">Categorii</h3>
              <ul className="space-y-1.5">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <a
                      href={`/catalog?category=${cat.slug}`}
                      className={`text-sm hover:text-primary transition-colors ${cat.slug === categorySlug ? "text-primary font-semibold" : "text-muted-foreground"}`}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-foreground text-sm">Brand</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={(checked) => {
                          setSelectedBrands(prev => checked ? [...prev, brand] : prev.filter(b => b !== brand));
                        }}
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic spec filters */}
            {specKeys.map(key => (
              <div key={key}>
                <h3 className="font-semibold mb-2 text-foreground text-sm capitalize">{key}</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(specValues[key] || []).map(val => (
                    <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={(selectedSpecs[key] || []).includes(val)}
                        onCheckedChange={() => toggleSpec(key, val)}
                      />
                      <span className="text-muted-foreground">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: perPage > 12 ? 6 : 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredBySpecs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">Nu am găsit produse.</p>
                <p className="text-sm">Încearcă să modifici filtrele.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredBySpecs.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      ← Anterior
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let page: number;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-9"
                          onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      Următor →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
