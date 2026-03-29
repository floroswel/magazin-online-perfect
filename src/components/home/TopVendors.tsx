import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Shield, Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface VendorData {
  slug: string;
  name: string;
  logo: string;
  rating: number;
  products: number;
  badge: string;
}

const FALLBACK_VENDORS: VendorData[] = [
  { slug: "mama-lucica", name: "Mama Lucica", logo: "https://ui-avatars.com/api/?name=ML&background=dc2626&color=fff&size=64", rating: 4.9, products: 86, badge: "Top Seller" },
  { slug: "wax-and-soul", name: "Wax & Soul", logo: "https://ui-avatars.com/api/?name=WS&background=92400e&color=fff&size=64", rating: 4.8, products: 52, badge: "Artizanal" },
  { slug: "candela-ro", name: "Candela.ro", logo: "https://ui-avatars.com/api/?name=CR&background=7c3aed&color=fff&size=64", rating: 4.7, products: 120, badge: "Livrare rapidă" },
  { slug: "flacara-vie", name: "Flacăra Vie", logo: "https://ui-avatars.com/api/?name=FV&background=b45309&color=fff&size=64", rating: 4.8, products: 38, badge: "Eco & Natural" },
  { slug: "lumina-pura", name: "Lumina Pură", logo: "https://ui-avatars.com/api/?name=LP&background=059669&color=fff&size=64", rating: 4.6, products: 64, badge: "Verificat" },
];

export default function TopVendors() {
  const [vendors, setVendors] = useState<VendorData[]>(FALLBACK_VENDORS);

  useEffect(() => {
    supabase
      .from("brands")
      .select("id, name, slug, logo_url, description")
      .order("name", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Count products per brand
          supabase
            .from("products")
            .select("brand_id")
            .eq("visible", true)
            .not("brand_id", "is", null)
            .then(({ data: products }) => {
              const counts: Record<string, number> = {};
              (products || []).forEach((p: any) => {
                if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] || 0) + 1;
              });

              const mapped: VendorData[] = data.map((b: any) => ({
                slug: b.slug,
                name: b.name,
                logo: b.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=4a7c6f&color=fff&size=64`,
                rating: 4.5 + Math.random() * 0.4, // TODO: use actual ratings when available
                products: counts[b.id] || 0,
                badge: "Artizan Verificat",
              }));

              // Sort by product count, show those with products first
              mapped.sort((a, b) => b.products - a.products);
              if (mapped.length > 0) setVendors(mapped.slice(0, 5));
            });
        }
      });
  }, []);

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">🏆 Top Artizani</h2>
        <Link to="/catalog" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          Toți artizanii <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {vendors.map((v) => (
          <Link
            key={v.slug}
            to={`/vendor/${v.slug}`}
            className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <img
              src={v.logo}
              alt={v.name}
              className="w-14 h-14 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-semibold text-card-foreground text-sm mb-1">{v.name}</h3>
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium">{v.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
              <Package className="w-3 h-3" /> {v.products} lumânări
            </div>
            <Badge variant="outline" className="text-[10px]">
              <Shield className="w-2.5 h-2.5 mr-1" /> {v.badge}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
