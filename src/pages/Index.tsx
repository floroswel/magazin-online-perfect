import { useEffect, useState, useMemo } from "react";
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

const DEFAULT_ORDER = [
  "hero_section", "social_proof_bar", "collections_grid",
  "featured_products", "flash_deals", "bestsellers_section",
  "brand_story_section", "scent_guide_teaser", "reviews_section",
  "recently_viewed", "newsletter_section",
];

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
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);

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

  // Fetch section order + Realtime subscription
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

  // Fetch featured products
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

  // Map section keys to visibility + JSX
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
  };

  const sectionComponents: Record<string, React.ReactNode> = useMemo(() => ({
    hero_section: <HeroSlider key="hero_section" />,
    social_proof_bar: <SocialProofBar key="social_proof_bar" />,
    collections_grid: <CollectionsGrid key="collections_grid" />,
    featured_products: (
      <section key="featured_products" className="container py-16 md:py-24 px-4" ref={featuredRef}>
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
    ),
    flash_deals: <FlashDeals key="flash_deals" title="Oferte Limitate" />,
    bestsellers_section: <BestSellers key="bestsellers_section" title="Cele mai iubite" />,
    brand_story_section: <BrandStory key="brand_story_section" />,
    scent_guide_teaser: <ScentGuideTeaser key="scent_guide_teaser" />,
    reviews_section: <ReviewsSection key="reviews_section" />,
    recently_viewed: <RecentlyViewed key="recently_viewed" />,
    newsletter_section: <NewsletterDiscount key="newsletter_section" />,
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
