import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search");

  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from("products").select("*");

      if (categorySlug) {
        const cat = categories.find(c => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      switch (sort) {
        case "price-asc": query = query.order("price", { ascending: true }); break;
        case "price-desc": query = query.order("price", { ascending: false }); break;
        case "rating": query = query.order("rating", { ascending: false }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        default: query = query.order("review_count", { ascending: false }); break;
      }

      const { data } = await query;
      let filtered = data || [];
      if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand));
      }
      setProducts(filtered);
      setLoading(false);
    }
    load();
  }, [categorySlug, searchQuery, sort, priceRange, selectedBrands, categories]);

  const currentCategory = categories.find(c => c.slug === categorySlug);

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            {searchQuery ? `Rezultate pentru "${searchQuery}"` : currentCategory?.name || "Toate produsele"}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtre
            </Button>
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
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-card p-6 overflow-y-auto" : "hidden"} md:block md:static md:w-64 flex-shrink-0 space-y-6`}>
            <div className="flex items-center justify-between md:hidden">
              <h2 className="text-lg font-bold">Filtre</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
            </div>

            {/* Price filter */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Preț</h3>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={10000}
                step={100}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{priceRange[0]} lei</span>
                <span>{priceRange[1]} lei</span>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Categorii</h3>
              <ul className="space-y-2">
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
                <h3 className="font-semibold mb-3 text-foreground">Brand</h3>
                <div className="space-y-2">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={(checked) => {
                          setSelectedBrands(prev =>
                            checked ? [...prev, brand] : prev.filter(b => b !== brand)
                          );
                        }}
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{products.length} produse găsite</p>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">Nu am găsit produse.</p>
                <p className="text-sm">Încearcă să modifici filtrele.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
