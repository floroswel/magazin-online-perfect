import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/home/HeroSlider";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import CategoryGrid from "@/components/home/CategoryGrid";
import FlashDeals from "@/components/home/FlashDeals";
import BestSellers from "@/components/home/BestSellers";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import PersonalizareSection from "@/components/home/PersonalizareSection";
import ScentQuiz from "@/components/home/ScentQuiz";
import SubscriptionSection from "@/components/home/SubscriptionSection";
import CorporateGiftingSection from "@/components/home/CorporateGiftingSection";
import ProcessSection from "@/components/home/ProcessSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SocialProofTicker from "@/components/home/SocialProofTicker";
import TrustFooterStrip from "@/components/home/TrustFooterStrip";
import NewsletterDiscount from "@/components/home/NewsletterDiscount";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import type { Tables } from "@/integrations/supabase/types";

interface HomepageSections {
  featured_title: string; flash_title: string; bestsellers_title: string;
  show_featured: boolean; show_flash: boolean; show_bestsellers: boolean;
  show_brands: boolean; show_recently_viewed: boolean; show_blog: boolean; show_mokka: boolean;
}

export default function Index() {
  const branding = useStoreBranding();
  const { welcomeMessage } = useCustomerGroups();
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<HomepageSections>({
    featured_title: "Selecția Noastră", flash_title: "Oferte Limitate",
    bestsellers_title: "Cele Mai Iubite", show_featured: true, show_flash: true,
    show_bestsellers: true, show_brands: false, show_recently_viewed: true,
    show_blog: false, show_mokka: false,
  });

  useEffect(() => {
    supabase.from("products").select("*").eq("featured", true).limit(8)
      .then(({ data }) => { setFeatured(data || []); setLoading(false); });
    supabase.from("app_settings").select("key, value_json")
      .in("key", ["homepage_sections"])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.key === "homepage_sections" && row.value_json && typeof row.value_json === "object" && !Array.isArray(row.value_json))
            setSections(row.value_json as unknown as HomepageSections);
        });
      });
  }, []);

  return (
    <Layout>
      {welcomeMessage && (
        <div className="bg-primary/10 border-b border-primary/20 py-3">
          <div className="container text-center text-sm font-medium text-primary">{welcomeMessage}</div>
        </div>
      )}
      <HeroSlider />

      <CategoryGrid />

      <PersonalizareSection />

      <ScentQuiz />

      {/* Featured products */}
      {sections.show_featured && (
        <section className="container py-16 md:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-medium">Curated</p>
              <h2 className="font-serif text-3xl font-medium text-foreground">{sections.featured_title}</h2>
            </div>
            <Link to="/catalog" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 tracking-wide transition-colors">
              Vezi toate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
            </div>
          )}
        </section>
      )}

      {sections.show_flash && <FlashDeals title={sections.flash_title} />}

      <SocialProofTicker />

      {sections.show_bestsellers && <BestSellers title={sections.bestsellers_title} />}

      <ProcessSection />

      <SubscriptionSection />

      <CorporateGiftingSection />

      <TestimonialsSection />

      {sections.show_recently_viewed && <RecentlyViewed />}

      <NewsletterDiscount />

      <TrustFooterStrip />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: branding.name,
        url: window.location.origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/catalog?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }) }} />
    </Layout>
  );
}
