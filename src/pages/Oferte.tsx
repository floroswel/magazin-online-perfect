import { useEffect, useState } from "react";
import { Zap, Filter, ChevronDown } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
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

export default function Oferte() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [sortBy, setSortBy] = useState<string>("discount");

  usePageSeo({
    title: "Oferte & Reduceri — MamaLucica Marketplace",
    description: "Cele mai bune oferte și reduceri pe MamaLucica. Economisește la mii de produse de la vendori verificați.",
  });

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("visible", true)
      .not("old_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter((p) => {
    if (!p.old_price || p.old_price <= p.price) return activeFilter === 0;
    const discount = Math.round(((p.old_price - p.price) / p.old_price) * 100);
    return discount >= discountFilters[activeFilter].min;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    // Default: by discount
    const dA = a.old_price ? ((a.old_price - a.price) / a.old_price) : 0;
    const dB = b.old_price ? ((b.old_price - b.price) / b.old_price) : 0;
    return dB - dA;
  });

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container px-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-extrabold">Oferte & Reduceri</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg">
            Cele mai bune prețuri din marketplace — actualizate zilnic
          </p>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mr-2">
            <Filter className="w-4 h-4" /> Filtrează:
          </div>
          {discountFilters.map((f, i) => (
            <button
              key={i}
              onClick={() => setActiveFilter(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeFilter === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-border hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto bg-card border border-border rounded-md px-3 py-1.5 text-sm text-card-foreground"
          >
            <option value="discount">Cea mai mare reducere</option>
            <option value="price_asc">Preț crescător</option>
            <option value="price_desc">Preț descrescător</option>
          </select>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {sorted.length} produse găsite
        </p>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Se încarcă ofertele...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nu am găsit oferte</h3>
            <p className="text-muted-foreground">Încearcă cu alt filtru de discount</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
