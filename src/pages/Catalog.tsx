import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { safeJsonLd } from "@/lib/sanitize-json-ld";

interface Cat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  banner_image: string | null;
  banner_link: string | null;
  visible: boolean;
  display_order: number;
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const smartSlug = searchParams.get("smart");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [smartCategory, setSmartCategory] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(24);
  const { symbol: currencySymbol } = useCurrency();
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    supabase.from("categories").select("id, name, slug, icon, parent_id, description, image_url, banner_image, banner_link, visible, display_order").order("display_order").order("name").then(({ data }) => setCategories((data as Cat[]) || []));
    supabase.from("brands").select("*").order("name").then(({ data }) => setBrands(data || []));
    supabase.from("products").select("price").order("price", { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0 && data[0].price) {
        const rounded = Math.ceil(Number(data[0].price) / 100) * 100;
        setMaxPrice(rounded);
        setPriceRange([0, rounded]);
      }
    });
  }, []);

  useEffect(() => {
    if (smartSlug) {
      supabase.from("dynamic_categories").select("id, name, description").eq("slug", smartSlug).eq("visible", true).maybeSingle()
        .then(({ data }) => setSmartCategory(data as any));
    } else { setSmartCategory(null); }
  }, [smartSlug]);

  useEffect(() => { setCurrentPage(1); }, [categorySlug, searchQuery, smartSlug, sort, priceRange, selectedBrands, inStockOnly, selectedRatings]);

  const currentCategory = categories.find(c => c.slug === categorySlug) || null;

  // Get all descendant category IDs for subcategory product inclusion
  const getDescendantIds = (parentId: string): string[] => {
    const children = categories.filter(c => c.parent_id === parentId);
    return children.reduce<string[]>((acc, child) => [...acc, child.id, ...getDescendantIds(child.id)], []);
  };

  const subcategories = currentCategory ? categories.filter(c => c.parent_id === currentCategory.id && c.visible) : [];

  // Breadcrumb chain
  const breadcrumbs = useMemo(() => {
    if (!currentCategory) return [];
    const chain: Cat[] = [];
    let cur: Cat | undefined = currentCategory;
    while (cur) {
      chain.unshift(cur);
      cur = categories.find(c => c.id === cur!.parent_id) as Cat | undefined;
    }
    return chain;
  }, [currentCategory, categories]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (smartSlug && smartCategory) {
        const { data: matchedIds } = await supabase.rpc("get_dynamic_category_products", {
          category_id: smartCategory.id, result_limit: perPage, result_offset: (currentPage - 1) * perPage,
        });
        const ids = (matchedIds || []).map((r: any) => r.product_id);
        if (ids.length === 0) { setProducts([]); setTotalCount(0); setLoading(false); return; }
        const { data: prods } = await supabase.from("products").select("*").in("id", ids);
        setProducts(prods || []);
        setTotalCount(ids.length < perPage ? (currentPage - 1) * perPage + ids.length : (currentPage + 1) * perPage);
        setLoading(false);
        return;
      }

      let query = supabase.from("products").select("*", { count: "exact" });

      if (categorySlug && currentCategory) {
        // Include products from subcategories too
        const allCatIds = [currentCategory.id, ...getDescendantIds(currentCategory.id)];
        query = query.in("category_id", allCatIds);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
      if (inStockOnly) query = query.gt("stock", 0);

      switch (sort) {
        case "price-asc": query = query.order("price", { ascending: true }); break;
        case "price-desc": query = query.order("price", { ascending: false }); break;
        case "rating": query = query.order("rating", { ascending: false }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        default: query = query.order("review_count", { ascending: false }); break;
      }

      const from = (currentPage - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      if (selectedBrands.length > 0) {
        const brandIds = brands.filter(b => selectedBrands.includes(b.name)).map(b => b.id);
        if (brandIds.length > 0) (query as any) = (query as any).in("brand_id", brandIds);
      }
      if (selectedRatings.length > 0) {
        const minRating = Math.min(...selectedRatings);
        query = query.gte("rating", minRating);
      }

      const { data, count } = await query;
      setProducts(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    }
    load();
  }, [categorySlug, searchQuery, smartSlug, smartCategory, sort, priceRange, selectedBrands, inStockOnly, selectedRatings, categories, currentPage, perPage]);

  // Dynamic SEO meta tags for categories
  useEffect(() => {
    if (currentCategory) {
      document.title = (currentCategory as any).meta_title || `${currentCategory.name} | VENTUZA`;
      const desc = (currentCategory as any).meta_description || `Cumpără ${currentCategory.name} online de la VENTUZA.`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
      metaDesc.setAttribute("content", desc);
    } else if (searchQuery) {
      document.title = `Căutare: ${searchQuery} | VENTUZA`;
    } else {
      document.title = "Catalog | VENTUZA";
    }
  }, [currentCategory, searchQuery]);

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = useMemo(() => {
    if (breadcrumbs.length === 0) return null;
    return safeJsonLd({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Acasă", item: window.location.origin },
        { "@type": "ListItem", position: 2, name: "Catalog", item: window.location.origin + "/catalog" },
        ...breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 3,
          name: b.name,
          item: window.location.origin + `/catalog?category=${b.slug}`,
        })),
      ],
    });
  }, [breadcrumbs]);

  const totalPages = Math.ceil(totalCount / perPage);

  const activeFiltersCount = [
    selectedBrands.length > 0, inStockOnly, selectedRatings.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const clearFilters = () => { setSelectedBrands([]); setInStockOnly(false); setSelectedRatings([]); setPriceRange([0, maxPrice]); };

  const specKeys = useMemo(() => {
    const keyCount: Record<string, number> = {};
    products.forEach(p => {
      if (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)) {
        Object.keys(p.specs as Record<string, unknown>).forEach(k => { keyCount[k] = (keyCount[k] || 0) + 1; });
      }
    });
    return Object.entries(keyCount).filter(([, count]) => count >= Math.max(2, products.length * 0.1)).map(([key]) => key).slice(0, 5);
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
      return { ...prev, [key]: current.includes(val) ? current.filter(v => v !== val) : [...current, val] };
    });
  };

  // Sidebar categories: show only root categories or children of current
  const sidebarCategories = currentCategory
    ? categories.filter(c => c.parent_id === currentCategory.id && c.visible)
    : categories.filter(c => !c.parent_id && c.visible);

  return (
    <Layout>
      <div className="container py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Home className="h-3.5 w-3.5" /> Acasă
            </Link>
            {breadcrumbs.map((bc, i) => (
              <span key={bc.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium">{bc.name}</span>
                ) : (
                  <Link to={`/catalog?category=${bc.slug}`} className="hover:text-primary transition-colors">{bc.name}</Link>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Category Header */}
        {currentCategory && (
          <div className="mb-6">
            <div className="flex items-start gap-4">
              {currentCategory.image_url && (
                <img src={currentCategory.image_url} alt={currentCategory.name} className="w-16 h-16 rounded-lg object-cover border" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{currentCategory.name}</h1>
                {currentCategory.description && (
                  <div className="text-sm text-muted-foreground mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: currentCategory.description }} />
                )}
              </div>
            </div>
            {/* Promotional Banner */}
            {currentCategory.banner_image && (
              <div className="mt-4">
                {currentCategory.banner_link ? (
                  <a href={currentCategory.banner_link} target="_blank" rel="noopener noreferrer">
                    <img src={currentCategory.banner_image} alt="Banner" className="w-full h-auto rounded-lg max-h-48 object-cover" />
                  </a>
                ) : (
                  <img src={currentCategory.banner_image} alt="Banner" className="w-full h-auto rounded-lg max-h-48 object-cover" />
                )}
              </div>
            )}
            {/* Subcategory Cards */}
            {subcategories.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
                {subcategories.map(sub => (
                  <Link key={sub.id} to={`/catalog?category=${sub.slug}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all">
                    {sub.image_url ? (
                      <img src={sub.image_url} alt={sub.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl">{sub.icon || "📁"}</span>
                    )}
                    <span className="text-xs font-medium text-foreground text-center">{sub.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Non-category headers */}
        {!currentCategory && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {searchQuery ? `Rezultate pentru "${searchQuery}"` : smartCategory?.name || "Toate produsele"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{totalCount} produse găsite</p>
            </div>
          </div>
        )}

        {currentCategory && (
          <p className="text-sm text-muted-foreground mb-4">Arătăm {totalCount} produse</p>
        )}

        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" className="md:hidden relative" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtre
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
            )}
          </Button>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Cele mai populare</SelectItem>
              <SelectItem value="price-asc">Preț crescător</SelectItem>
              <SelectItem value="price-desc">Preț descrescător</SelectItem>
              <SelectItem value="rating">Cele mai bine evaluate</SelectItem>
              <SelectItem value="newest">Cele mai noi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-6">
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-card p-6 overflow-y-auto" : "hidden"} md:block md:static md:w-64 flex-shrink-0 space-y-5`}>
            <div className="flex items-center justify-between md:hidden">
              <h2 className="text-lg font-bold">Filtre</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={clearFilters}>Resetează filtrele ({activeFiltersCount})</Button>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-foreground text-sm">Preț</h3>
              <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={maxPrice} step={100} className="mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{priceRange[0]} {currencySymbol}</span>
                <span>{priceRange[1]} {currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={inStockOnly} onCheckedChange={v => setInStockOnly(!!v)} />
                <span className="text-foreground font-medium">Doar în stoc</span>
              </label>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-foreground text-sm">Rating minim</h3>
              <div className="space-y-1.5">
                {[4, 3, 2].map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedRatings.includes(r)} onCheckedChange={checked => setSelectedRatings(prev => checked ? [...prev, r] : prev.filter(x => x !== r))} />
                    <span className="text-muted-foreground">{"⭐".repeat(r)} & peste</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-foreground text-sm">Categorii</h3>
              <ul className="space-y-1.5">
                {sidebarCategories.map(cat => (
                  <li key={cat.id}>
                    <Link to={`/catalog?category=${cat.slug}`}
                      className={`text-sm hover:text-primary transition-colors ${cat.slug === categorySlug ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {brands.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-foreground text-sm">Brand</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedBrands.includes(brand.name)} onCheckedChange={checked => setSelectedBrands(prev => checked ? [...prev, brand.name] : prev.filter(b => b !== brand.name))} />
                      {brand.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {specKeys.map(key => (
              <div key={key}>
                <h3 className="font-semibold mb-2 text-foreground text-sm capitalize">{key}</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(specValues[key] || []).map(val => (
                    <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={(selectedSpecs[key] || []).includes(val)} onCheckedChange={() => toggleSpec(key, val)} />
                      <span className="text-muted-foreground">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />))}
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Anterior</Button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let page: number;
                      if (totalPages <= 7) page = i + 1;
                      else if (currentPage <= 4) page = i + 1;
                      else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                      else page = currentPage - 3 + i;
                      return (
                        <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="w-9"
                          onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{page}</Button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Următor →</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      )}
    </Layout>
  );
}
