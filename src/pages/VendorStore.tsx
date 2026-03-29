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

// Mock vendor data (in production, fetch from vendors table)
const mockVendors: Record<string, any> = {
  "mama-lucica": {
    name: "Mama Lucica",
    slug: "mama-lucica",
    logo: "https://ui-avatars.com/api/?name=Mama+Lucica&background=dc2626&color=fff&size=128",
    banner: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=1200&h=300&fit=crop",
    description: "Lumânări artizanale din soia, turnate manual cu uleiuri esențiale naturale. Fiecare lumânare este creată cu dragoste în atelierul nostru din București.",
    rating: 4.9,
    reviewCount: 340,
    productCount: 86,
    responseRate: "99%",
    responseTime: "< 2 ore",
    location: "București, România",
    joinedDate: "2021",
    badges: ["Artizan Verificat", "Top Seller", "100% Natural"],
    policies: {
      shipping: "Livrare gratuită pentru comenzi peste 150 lei. Livrare standard: 2-4 zile lucrătoare. Ambalaj premium inclus.",
      returns: "Retur gratuit în 14 zile. Lumânările personalizate nu pot fi returnate.",
      warranty: "Garantăm calitatea ingredientelor. Dacă nu ești mulțumit, îți oferim un înlocuitor sau ramburs.",
    },
  },
};

export default function VendorStore() {
  const { slug } = useParams();
  const vendor = mockVendors[slug || ""] || mockVendors["mama-lucica"];
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  usePageSeo({
    title: `${vendor.name} — Magazin pe MamaLucica`,
    description: vendor.description,
  });

  useEffect(() => {
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
  }, [slug]);

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
              className="w-20 h-20 rounded-xl border-4 border-card shadow-md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-card-foreground">{vendor.name}</h1>
                <Badge className="bg-[hsl(var(--marketplace-success))] text-white">
                  <Shield className="w-3 h-3 mr-1" /> Verificat
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-3">{vendor.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <strong>{vendor.rating}</strong>
                  <span className="text-muted-foreground">({vendor.reviewCount} recenzii)</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" /> {vendor.productCount} produse
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {vendor.location}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" /> Răspuns: {vendor.responseRate}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {vendor.badges.map((badge: string) => (
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
            {loading ? (
              <p className="text-center text-muted-foreground py-12">Se încarcă...</p>
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
              <h3 className="text-xl font-bold mb-2">Rating mediu: {vendor.rating} / 5</h3>
              <p className="text-muted-foreground">Bazat pe {vendor.reviewCount} recenzii ale clienților</p>
            </div>
          </TabsContent>

          <TabsContent value="policies">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <Truck className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Livrare</h4>
                <p className="text-sm text-muted-foreground">{vendor.policies.shipping}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Package className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Retururi</h4>
                <p className="text-sm text-muted-foreground">{vendor.policies.returns}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Shield className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold mb-2">Garanție</h4>
                <p className="text-sm text-muted-foreground">{vendor.policies.warranty}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
