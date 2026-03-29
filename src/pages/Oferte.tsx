import { useEffect, useState } from "react";
import { Zap, Filter, Tag, TrendingDown, Clock, Percent } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const discountFilters = [
  { label: "Toate", min: 0 },
  { label: "10%+", min: 10 },
  { label: "20%+", min: 20 },
  { label: "30%+", min: 30 },
  { label: "50%+", min: 50 },
];

const priceFilters = [
  { label: "Orice preț", max: Infinity },
  { label: "Sub 30 lei", max: 30 },
  { label: "Sub 50 lei", max: 50 },
  { label: "Sub 100 lei", max: 100 },
  { label: "100+ lei", max: Infinity, min: 100 },
];

export default function Oferte() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiscount, setActiveDiscount] = useState(0);
  const [activePrice, setActivePrice] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("discount");

  usePageSeo({
    title: "Oferte & Reduceri Lumânări — MamaLucica",
    description: "Cele mai bune oferte la lumânări artizanale. Economisește la lumânări parfumate, decorative și seturi cadou.",
  });

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("visible", true)
      .not("old_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const valid = (data || []).filter(p => p.old_price && p.old_price > p.price);
        setProducts(valid);
        setLoading(false);
      });

    supabase
      .from("categories")
      .select("id, name, slug")
      .is("parent_id", null)
      .eq("visible", true)
      .order("display_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  const getDiscount = (p: Tables<"products">) =>
    p.old_price && p.old_price > p.price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;

  const filtered = products.filter((p) => {
    const discount = getDiscount(p);
    if (discount < discountFilters[activeDiscount].min) return false;

    const pf = priceFilters[activePrice];
    if (pf.max !== Infinity && p.price > pf.max) return false;
    if ((pf as any).min && p.price < (pf as any).min) return false;

    if (activeCategory && p.category_id !== activeCategory) return false;

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return getDiscount(b) - getDiscount(a);
  });

  const maxDiscount = products.length > 0 ? Math.max(...products.map(getDiscount)) : 0;
  const totalSaved = products.reduce((sum, p) => sum + (p.old_price ? p.old_price - p.price : 0), 0);

  return (
    <Layout>
      {/* Hero banner */}
      <div className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 text-6xl rotate-12 hidden md:block">🏷️</div>
          <div className="absolute bottom-4 right-16 text-5xl -rotate-6 hidden md:block">💰</div>
          <div className="absolute top-8 right-40 text-4xl rotate-45 hidden md:block">✨</div>
        </div>
        <div className="container px-4 py-8 md:py-14 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-foreground/20 p-2 rounded-xl shrink-0">
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground">Oferte & Reduceri</h1>
              <p className="text-primary-foreground/70 text-xs md:text-sm">Actualizate zilnic • Stocuri limitate</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-4 mt-4 md:mt-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 md:py-3 text-primary-foreground text-center md:text-left">
              <p className="text-lg md:text-2xl font-bold">{products.length}</p>
              <p className="text-[10px] md:text-xs opacity-70">Produse la ofertă</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 md:py-3 text-primary-foreground text-center md:text-left">
              <p className="text-lg md:text-2xl font-bold">-{maxDiscount}%</p>
              <p className="text-[10px] md:text-xs opacity-70">Reducere maximă</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 md:py-3 text-primary-foreground text-center md:text-left">
              <p className="text-lg md:text-2xl font-bold">{totalSaved.toFixed(0)} lei</p>
              <p className="text-[10px] md:text-xs opacity-70">Economie totală</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-4 md:py-6">
        {/* Filters section */}
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 mb-4 md:mb-6 space-y-3 md:space-y-4">
          {/* Discount filters */}
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Percent className="w-3 h-3 md:w-3.5 md:h-3.5" /> Procent reducere
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {discountFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDiscount(i)}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 min-h-[36px] md:min-h-[auto] ${
                    activeDiscount === i
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-card-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price filters */}
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3 md:w-3.5 md:h-3.5" /> Interval preț
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {priceFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActivePrice(i)}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 min-h-[36px] md:min-h-[auto] ${
                    activePrice === i
                      ? "bg-accent text-accent-foreground border-accent shadow-sm"
                      : "bg-card text-card-foreground border-border hover:border-accent/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Filter className="w-3 h-3 md:w-3.5 md:h-3.5" /> Categorie
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 min-h-[36px] md:min-h-[auto] ${
                    !activeCategory
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-card-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  Toate
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 min-h-[36px] md:min-h-[auto] ${
                      activeCategory === cat.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-card-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort + count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border pt-3 gap-2">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{sorted.length}</strong> produse găsite
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-card-foreground w-full sm:w-auto"
            >
              <option value="discount">Cea mai mare reducere</option>
              <option value="price_asc">Preț crescător</option>
              <option value="price_desc">Preț descrescător</option>
              <option value="newest">Cele mai noi</option>
            </select>
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
            Se încarcă ofertele...
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nu am găsit oferte</h3>
            <p className="text-muted-foreground text-sm">Încearcă cu alt filtru sau revino mai târziu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
