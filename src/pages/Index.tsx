import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import InstagramFeed from "@/components/home/InstagramFeed";
import BrandLogosCarousel from "@/components/home/BrandLogosCarousel";
import QuickFilters from "@/components/home/QuickFilters";
import CouponCollector from "@/components/home/CouponCollector";
import TopVendors from "@/components/home/TopVendors";
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
  "hero_section", "social_proof_bar", "quick_filters", "collections_grid",
  "coupon_collector", "flash_deals", "scent_guide_teaser",
  "featured_products", "top_vendors", "brand_story_section",
  "bestsellers_section", "buy_again", "instagram_feed",
  "reviews_section", "brand_logos",
  "recently_viewed", "newsletter_section",
];

export default function Index() {
  const branding = useStoreBranding();
  usePageSeo({
    title: "MamaLucica — Marketplace Online România",
    description: "Cumpără mii de produse de la vendori verificați. Prețuri mici, livrare rapidă, plată securizată. Marketplace-ul tău de încredere.",
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
    brand_logos: true,
    quick_filters: true,
    coupon_collector: true,
    top_vendors: true,
    buy_again: true,
  };

  const sectionComponents: Record<string, React.ReactNode> = useMemo(() => ({
    hero_section: <HeroSlider key="hero_section" />,
    social_proof_bar: <SocialProofBar key="social_proof_bar" />,
    collections_grid: <CollectionsGrid key="collections_grid" />,
    featured_products: (
      <section key="featured_products" className="container py-8 md:py-12 px-4" ref={featuredRef}>
        <div className="flex items-center justify-between mb-5 reveal stagger-1">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Produse Recomandate</h2>
          <Link to="/catalog" className="text-primary text-sm font-medium hover:underline">Vezi toate →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 reveal stagger-2">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
          </div>
        )}
      </section>
    ),
    flash_deals: <FlashDeals key="flash_deals" title="⚡ Flash Deals" />,
    bestsellers_section: <BestSellers key="bestsellers_section" title="Cele Mai Vândute" />,
    brand_story_section: <BrandStory key="brand_story_section" />,
    scent_guide_teaser: <ScentGuideTeaser key="scent_guide_teaser" />,
    reviews_section: <ReviewsSection key="reviews_section" />,
    instagram_feed: <InstagramFeed key="instagram_feed" />,
    brand_logos: <BrandLogosCarousel key="brand_logos" />,
    recently_viewed: <RecentlyViewed key="recently_viewed" />,
    newsletter_section: <NewsletterDiscount key="newsletter_section" />,
    quick_filters: <QuickFilters key="quick_filters" />,
    coupon_collector: <CouponCollector key="coupon_collector" />,
    top_vendors: <TopVendors key="top_vendors" />,
    buy_again: <BuyAgain key="buy_again" />,
  }), [featured, loading, featuredRef]);

  return (
    <Layout>
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
