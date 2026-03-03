import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Truck, Shield, RotateCcw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import MokkaBanner from "@/components/mokka/MokkaBanner";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryGrid from "@/components/home/CategoryGrid";
import FlashDeals from "@/components/home/FlashDeals";
import BestSellers from "@/components/home/BestSellers";
import BrandCarousel from "@/components/home/BrandCarousel";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import BlogPreview from "@/components/home/BlogPreview";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function Index() {
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .limit(8)
      .then(({ data }) => {
        setFeatured(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      {/* Hero Banner Slider */}
      <HeroSlider />

      {/* Benefits bar */}
      <section className="bg-card border-b">
        <div className="container py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, text: "Livrare gratuită peste 200 lei" },
              { icon: Shield, text: "Garanție 2 ani" },
              { icon: RotateCcw, text: "Returnare în 30 zile" },
              { icon: Zap, text: "Oferte flash zilnice" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <b.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category grid */}
      <CategoryGrid />

      {/* Featured products */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Produse recomandate</h2>
          <Link to="/catalog" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
            Vezi toate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Flash Deals with countdown */}
      <FlashDeals />

      {/* Mokka banner */}
      <MokkaBanner />

      {/* Best Sellers */}
      <BestSellers />

      {/* Brand carousel */}
      <BrandCarousel />

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Blog preview */}
      <BlogPreview />
    </Layout>
  );
}
