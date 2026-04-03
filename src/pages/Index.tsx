import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import HomepageCatalog from "@/components/home/HomepageCatalog";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import PersonalizedRecommendations from "@/components/home/PersonalizedRecommendations";
import WelcomeBack from "@/components/home/WelcomeBack";
import InstagramFeed from "@/components/home/InstagramFeed";
import BrandLogosCarousel from "@/components/home/BrandLogosCarousel";
import QuickFilters from "@/components/home/QuickFilters";
import CouponCollector from "@/components/home/CouponCollector";
import CandleMoodSelector from "@/components/home/CandleMoodSelector";

import BuyAgain from "@/components/home/BuyAgain";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { usePageSeo } from "@/components/SeoHead";
import { useVisibility } from "@/hooks/useVisibility";
import type { Tables } from "@/integrations/supabase/types";

const DEFAULT_ORDER = [
  "hero_section", "social_proof_bar", "quick_filters", "mood_selector", "product_catalog", "collections_grid",
  "coupon_collector", "flash_deals", "scent_guide_teaser",
  "featured_products", "personalized_recommendations", "brand_story_section",
  "bestsellers_section", "buy_again", "instagram_feed",
  "reviews_section", "brand_logos",
  "recently_viewed", "newsletter_section",
];

export default function Index() {
  const branding = useStoreBranding();
  usePageSeo({
    title: "MamaLucica — Magazin de Lumânări Artizanale Handmade",
    description: "Descoperă lumânări artizanale handmade de la artizani verificați. Lumânări parfumate, decorative, cadouri și seturi premium. Livrare rapidă în România.",
    ogImage: "/og-homepage.jpg",
  });
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useScrollReveal();
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);

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
  const showInstagram = useVisibility("instagram_feed");
  const showQuickFilters = useVisibility("quick_filters");
  const showCouponCollector = useVisibility("coupon_collector");
  
  const showBuyAgain = useVisibility("buy_again");
  const showBrandLogos = useVisibility("brand_logos");
  const showProductCatalog = useVisibility("product_catalog");

  useEffect(() => {
    const fetchOrder = () => {
      (supabase as any)
        .from("site_layout_settings")
        .select("value_json")
        .eq("setting_key", "homepage_section_order")
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.value_json && Array.isArray(data.value_json)) {
            setSectionOrder(data.value_json as string[]);
          }
        });
    };
    fetchOrder();

    const channel = supabase
      .channel("homepage-order")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "site_layout_settings", filter: "setting_key=eq.homepage_section_order" },
        () => fetchOrder()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => { setFeatured(data || []); setLoading(false); });
  }, []);

  const visibilityMap: Record<string, boolean | undefined> = {
    hero_section: showHero,
    social_proof_bar: showSocialProof,
    collections_grid: showCollections,
    featured_products: showFeatured,
    flash_deals: showFlashDeals,
    bestsellers_section: showBestsellers,
    brand_story_section: showBrandStory,
    scent_guide_teaser: showScentGuide,
    reviews_section: showReviews,
    recently_viewed: showRecentlyViewed,
    newsletter_section: showNewsletter,
    instagram_feed: showInstagram,
    brand_logos: showBrandLogos,
    quick_filters: showQuickFilters,
    coupon_collector: showCouponCollector,
    top_vendors: showTopVendors,
    buy_again: showBuyAgain,
    product_catalog: showProductCatalog,
  };

  const EB = ErrorBoundary;

  const sectionComponents: Record<string, React.ReactNode> = useMemo(() => ({
    hero_section: <EB key="hero_section" fallback={null}><HeroSlider /></EB>,
    social_proof_bar: <EB key="social_proof_bar" fallback={null}><SocialProofBar /></EB>,
    collections_grid: <EB key="collections_grid" fallback={null}><CollectionsGrid /></EB>,
    featured_products: (
      <EB key="featured_products" fallback={null}>
        <section className="container py-6 md:py-8 px-4" ref={featuredRef}>
          <div className="flex items-center justify-between mb-4 reveal stagger-1">
            <h2 className="text-lg md:text-xl font-bold text-foreground">Produse Recomandate</h2>
            <Link to="/catalog" className="text-primary text-sm font-semibold hover:underline">Vezi toate →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 reveal stagger-2">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
            </div>
          )}
        </section>
      </EB>
    ),
    flash_deals: <EB key="flash_deals" fallback={null}><FlashDeals title="⚡ Flash Deals" /></EB>,
    bestsellers_section: <EB key="bestsellers_section" fallback={null}><BestSellers title="Cele Mai Vândute" /></EB>,
    brand_story_section: <EB key="brand_story_section" fallback={null}><BrandStory /></EB>,
    scent_guide_teaser: <EB key="scent_guide_teaser" fallback={null}><ScentGuideTeaser /></EB>,
    reviews_section: <EB key="reviews_section" fallback={null}><ReviewsSection /></EB>,
    instagram_feed: <EB key="instagram_feed" fallback={null}><InstagramFeed /></EB>,
    brand_logos: <EB key="brand_logos" fallback={null}><BrandLogosCarousel /></EB>,
    recently_viewed: <EB key="recently_viewed" fallback={null}><RecentlyViewed /></EB>,
    personalized_recommendations: <EB key="personalized_recommendations" fallback={null}><PersonalizedRecommendations /></EB>,
    newsletter_section: <EB key="newsletter_section" fallback={null}><NewsletterDiscount /></EB>,
    quick_filters: <EB key="quick_filters" fallback={null}><QuickFilters /></EB>,
    coupon_collector: <EB key="coupon_collector" fallback={null}><CouponCollector /></EB>,
    top_vendors: <EB key="top_vendors" fallback={null}><TopVendors /></EB>,
    buy_again: <EB key="buy_again" fallback={null}><BuyAgain /></EB>,
    mood_selector: <EB key="mood_selector" fallback={null}><CandleMoodSelector /></EB>,
    product_catalog: <EB key="product_catalog" fallback={null}><HomepageCatalog /></EB>,
  }), [featured, loading, featuredRef]);

  return (
    <Layout>
      <WelcomeBack />
      {sectionOrder.map((key) => {
        if (visibilityMap[key] === false) return null;
        return sectionComponents[key] || null;
      })}

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
