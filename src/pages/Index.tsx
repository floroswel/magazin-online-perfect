import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/home/HeroSlider";
import SocialProofBar from "@/components/home/SocialProofBar";
import CollectionsGrid from "@/components/home/CollectionsGrid";
import BestSellers from "@/components/home/BestSellers";
import BrandStory from "@/components/home/BrandStory";
import ScentGuideTeaser from "@/components/home/ScentGuideTeaser";
import ReviewsSection from "@/components/home/ReviewsSection";
import NewsletterDiscount from "@/components/home/NewsletterDiscount";
import FlashDeals from "@/components/home/FlashDeals";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { isCandleCollection } from "@/lib/candleCatalog";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { usePageSeo } from "@/components/SeoHead";
import { useVisibility } from "@/hooks/useVisibility";
import type { Tables } from "@/integrations/supabase/types";

// Section key → component map for dynamic ordering
const SECTION_MAP: Record<string, { component: React.ReactNode; ref?: boolean }> = {};

export default function Index() {
  const branding = useStoreBranding();
  usePageSeo({
    title: "VENTUZA — Lumânări Artizanale Premium din România",
    description: "Descoperă lumânări artizanale create din ingrediente naturale, parfumuri rare și cere de soia. Livrare în 24-48h.",
    ogImage: "/og-homepage.jpg",
  });
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useScrollReveal();

  // Visibility hooks
  const showHero = useVisibility("hero_section");
  const showSocialProof = useVisibility("social_proof_bar");
  const showCollections = useVisibility("collections_grid");
  const showFeatured = useVisibility("featured_products");
  const showFlashDeals = useVisibility("flash_deals");
  const showBestsellers = useVisibility("bestsellers_section");
  const showBrandStory = useVisibility("brand_story_section");
  const showScentGuide = useVisibility("scent_guide_teaser");
  const showReviews = useVisibility("reviews_section");
  const showRecentlyViewed = useVisibility("recently_viewed");
  const showNewsletter = useVisibility("newsletter_section");

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("visible", true)
      .then(({ data: cats }) => {
        const ids = ((cats || []) as Array<{ id: string; name: string; slug: string }>)
          .filter((cat) => isCandleCollection(cat))
          .map((cat) => cat.id);
        if (ids.length === 0) { setFeatured([]); setLoading(false); return; }
        supabase
          .from("products")
          .select("*")
          .eq("featured", true)
          .in("category_id", ids)
          .limit(8)
          .then(({ data }) => { setFeatured(data || []); setLoading(false); });
      });
  }, []);

  return (
    <Layout>
      {showHero !== false && <HeroSlider />}
      {showSocialProof !== false && <SocialProofBar />}
      {showCollections !== false && <CollectionsGrid />}

      {/* Featured Products */}
      {showFeatured !== false && (
        <section className="container py-16 md:py-24 px-4" ref={featuredRef}>
          <div className="flex items-end justify-between mb-10 reveal stagger-1">
            <div>
              <p className="font-sans text-[11px] tracking-[4px] uppercase text-primary mb-2">SELECȚIA NOASTRĂ</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">Produse recomandate</h2>
            </div>
            <Link to="/catalog" className="font-sans text-sm text-primary hover:text-ventuza-amber-dark font-medium flex items-center gap-1.5 transition-colors">
              Vezi toate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal stagger-2">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
            </div>
          )}
        </section>
      )}

      {showFlashDeals !== false && <FlashDeals title="Oferte Limitate" />}
      {showBestsellers !== false && <BestSellers title="Cele mai iubite" />}
      {showBrandStory !== false && <BrandStory />}
      {showScentGuide !== false && <ScentGuideTeaser />}
      {showReviews !== false && <ReviewsSection />}
      {showRecentlyViewed !== false && <RecentlyViewed />}
      {showNewsletter !== false && <NewsletterDiscount />}

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
