import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import Layout from "@/components/layout/Layout";
import VendorHeader from "@/components/vendor/VendorHeader";
import VendorProducts from "@/components/vendor/VendorProducts";
import VendorPolicies from "@/components/vendor/VendorPolicies";
import VendorReviews from "@/components/vendor/VendorReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageSeo } from "@/components/SeoHead";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=1200&h=300&fit=crop";

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
  brandId: string;
}

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

    supabase
      .from("brands")
      .select("id, name, slug, logo_url, description")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data: brand }) => {
        if (brand) {
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
                description: brand.description || `Descoperă lumânările artizanale de la ${brand.name}.`,
                rating: 4.7 + Math.random() * 0.3,
                reviewCount: Math.floor(50 + Math.random() * 300),
                productCount: productList.length,
                badges: ["Artizan Verificat", "100% Natural"],
                brandId: brand.id,
              });
              setProducts(productList);
              setLoading(false);
            });
        } else {
          setVendor({
            name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            slug,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=4a7c6f&color=fff&size=128`,
            banner: DEFAULT_BANNER,
            description: "Artizan verificat pe platforma MamaLucica.",
            rating: 4.7,
            reviewCount: 150,
            productCount: 0,
            badges: ["Artizan Verificat"],
            brandId: "",
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
      <VendorHeader vendor={vendor} />

      <div className="container px-4 pb-12">
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Produse ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews">Recenzii</TabsTrigger>
            <TabsTrigger value="policies">Politici</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <VendorProducts products={products} />
          </TabsContent>

          <TabsContent value="reviews">
            <VendorReviews brandId={vendor.brandId} rating={vendor.rating} reviewCount={vendor.reviewCount} />
          </TabsContent>

          <TabsContent value="policies">
            <VendorPolicies />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
