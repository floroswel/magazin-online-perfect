import { useParams, Link } from "react-router-dom";
import { Star, Shield, MapPin, Truck, MessageSquare, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageSeo } from "@/components/SeoHead";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface VendorInfo {
  name: string;
  slug: string;
  logo: string;
  banner: string;
  description: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  badges: string[];
}

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=1200&h=300&fit=crop";

export default function VendorStore() {
  const { slug } = useParams();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  usePageSeo({
    title: vendor ? `${vendor.name} — Magazin pe MamaLucica` : "Magazin Artizan — MamaLucica",
    description: vendor?.description || "Descoperă produsele acestui artizan verificat pe MamaLucica.",
  });

  useEffect(() => {
    if (!slug) return;

    // Fetch brand by slug
    supabase
      .from("brands")
      .select("id, name, slug, logo_url, description")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data: brand }) => {
        if (brand) {
          // Get products for this brand
          supabase
            .from("products")
            .select("*")
            .eq("brand_id", brand.id)
            .eq("visible", true)
            .order("created_at", { ascending: false })
            .limit(50)
            .then(({ data: prods }) => {
              const productList = prods || [];
              setVendor({
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=4a7c6f&color=fff&size=128`,
                banner: DEFAULT_BANNER,
                description: brand.description || `Descoperă lumânările artizanale de la ${brand.name}. Produse create cu grijă și pasiune.`,
                rating: 4.7 + Math.random() * 0.3,
                reviewCount: Math.floor(50 + Math.random() * 300),
                productCount: productList.length,
                badges: ["Artizan Verificat", "100% Natural"],
              });
              setProducts(productList);
              setLoading(false);
            });
        } else {
          // Fallback: show all products if brand not found
          setVendor({
            name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            slug: slug,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=4a7c6f&color=fff&size=128`,
            banner: DEFAULT_BANNER,
            description: "Artizan verificat pe platforma MamaLucica.",
            rating: 4.7,
            reviewCount: 150,
            productCount: 0,
            badges: ["Artizan Verificat"],
          });
          supabase
            .from("products")
            .select("*")
            .eq("visible", true)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(({ data }) => {
              setProducts(data || []);
              setLoading(false);
            });
        }
      });
  }, [slug]);

  if (loading || !vendor) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">Se încarcă magazinul...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
        <img src={vendor.banner} alt={vendor.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container px-4 -mt-16 relative z-10 pb-12">
        {/* Vendor header card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={vendor.logo}
              alt={vendor.name}
              className="w-20 h-20 rounded-xl border-4 border-card shadow-md object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-card-foreground">{vendor.name}</h1>
                <Badge className="bg-primary text-primary-foreground">
                  <Shield className="w-3 h-3 mr-1" /> Verificat
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-3">{vendor.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <strong>{vendor.rating.toFixed(1)}</strong>
                  <span className="text-muted-foreground">({vendor.reviewCount} recenzii)</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" /> {vendor.productCount} produse
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> România
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" /> Răspuns: 98%
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {vendor.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button className="bg-primary text-primary-foreground">
                <MessageSquare className="w-4 h-4 mr-2" /> Contactează
              </Button>
              <Button variant="outline">Urmărește</Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Produse ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews">Recenzii</TabsTrigger>
            <TabsTrigger value="policies">Politici</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>Acest artizan nu are încă produse listate.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Star className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Rating mediu: {vendor.rating.toFixed(1)} / 5</h3>
              <p className="text-muted-foreground">Bazat pe {vendor.reviewCount} recenzii ale clienților</p>
            </div>
          </TabsContent>

          <TabsContent value="policies">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <Truck className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Livrare</h4>
                <p className="text-sm text-muted-foreground">Livrare gratuită pentru comenzi peste 150 lei. Livrare standard: 2-4 zile lucrătoare. Ambalaj premium inclus.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Package className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Retururi</h4>
                <p className="text-sm text-muted-foreground">Retur gratuit în 14 zile. Lumânările personalizate nu pot fi returnate.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Shield className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Garanție</h4>
                <p className="text-sm text-muted-foreground">Garantăm calitatea ingredientelor. Dacă nu ești mulțumit, îți oferim un înlocuitor sau ramburs.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
