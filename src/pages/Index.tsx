import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import MokkaBanner from "@/components/mokka/MokkaBanner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function Index() {
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [deals, setDeals] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [featuredRes, dealsRes] = await Promise.all([
        supabase.from("products").select("*").eq("featured", true).limit(8),
        supabase.from("products").select("*").not("old_price", "is", null).order("created_at", { ascending: false }).limit(4),
      ]);
      setFeatured(featuredRes.data || []);
      setDeals(dealsRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Layout>
      {/* Hero Banner */}
      <section className="emag-gradient">
        <div className="container py-10 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Cele mai bune oferte sunt aici! 🔥
            </h1>
            <p className="text-lg text-foreground/80 mb-6">
              Descoperă mii de produse la prețuri imbatabile. Livrare rapidă în toată România.
            </p>
            <Link to="/catalog">
              <Button size="lg" className="font-semibold text-base">
                Vezi toate produsele
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

      {/* Mokka banner */}
      <MokkaBanner />

      {/* Deals */}
      {deals.length > 0 && (
        <section className="bg-card py-8">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">🔥 Oferte ale zilei</h2>
              <Link to="/catalog" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                Vezi toate <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {deals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
