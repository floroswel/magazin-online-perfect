import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/home/HeroSlider";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import FlashDeals from "@/components/home/FlashDeals";
import BestSellers from "@/components/home/BestSellers";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import PersonalizareSection from "@/components/home/PersonalizareSection";
import ScentQuiz from "@/components/home/ScentQuiz";
import ProcessSection from "@/components/home/ProcessSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SocialProofTicker from "@/components/home/SocialProofTicker";
import TrustFooterStrip from "@/components/home/TrustFooterStrip";
import WhyVentuza from "@/components/home/WhyVentuza";
import NewsletterDiscount from "@/components/home/NewsletterDiscount";
import { supabase } from "@/integrations/supabase/client";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { isCandleCollection } from "@/lib/candleCatalog";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import type { Tables } from "@/integrations/supabase/types";

interface HomepageSection {
  key: string;
  label: string;
  visible: boolean;
  title?: string;
}

const DEFAULT_ORDER: HomepageSection[] = [
  { key: "hero", label: "Hero Slider", visible: true },
  { key: "personalizare", label: "Secțiune Personalizare", visible: true },
  { key: "scent_quiz", label: "Quiz Parfum", visible: true },
  { key: "featured", label: "Produse Recomandate", visible: true, title: "Selecția Noastră" },
  { key: "flash", label: "Oferte Flash", visible: true, title: "Oferte Limitate" },
  { key: "social_proof", label: "Social Proof Ticker", visible: true },
  { key: "bestsellers", label: "Bestsellers", visible: true, title: "Cele Mai Iubite" },
  { key: "why_ventuza", label: "De Ce VENTUZA", visible: true },
  { key: "process", label: "Procesul Nostru", visible: true },
  { key: "testimonials", label: "Testimoniale", visible: true },
  { key: "recently_viewed", label: "Recent Vizualizate", visible: true },
  { key: "newsletter", label: "Newsletter", visible: true },
  { key: "trust_strip", label: "Bara de Trust", visible: true },
];

export default function Index() {
  const branding = useStoreBranding();
  const { welcomeMessage } = useCustomerGroups();
  const [featured, setFeatured] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionOrder, setSectionOrder] = useState<HomepageSection[]>(DEFAULT_ORDER);

  useEffect(() => {
    // Load featured products
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("visible", true)
      .then(({ data: cats }) => {
        const candleCategoryIds = ((cats || []) as Array<{ id: string; name: string; slug: string }>).filter((cat) =>
          isCandleCollection(cat)
        ).map((cat) => cat.id);

        if (candleCategoryIds.length === 0) {
          setFeatured([]);
          setLoading(false);
          return;
        }

        supabase
          .from("products")
          .select("*")
          .eq("featured", true)
          .in("category_id", candleCategoryIds)
          .limit(8)
          .then(({ data }) => {
            setFeatured(data || []);
            setLoading(false);
          });
      });

    // Load section order from admin settings
    supabase.from("app_settings").select("key, value_json")
      .in("key", ["homepage_section_order"])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.key === "homepage_section_order" && Array.isArray(row.value_json)) {
            const saved = row.value_json as unknown as HomepageSection[];
            // Merge with defaults
            const merged = DEFAULT_ORDER.map(def => {
              const found = saved.find(s => s.key === def.key);
              return found ? { ...def, ...found } : def;
            });
            // Reorder based on saved order
            const orderedKeys = saved.map(s => s.key);
            merged.sort((a, b) => {
              const ai = orderedKeys.indexOf(a.key);
              const bi = orderedKeys.indexOf(b.key);
              if (ai === -1 && bi === -1) return 0;
              if (ai === -1) return 1;
              if (bi === -1) return -1;
              return ai - bi;
            });
            setSectionOrder(merged);
          }
        });
      });
  }, []);

  const getTitle = (key: string, fallback: string) => {
    const section = sectionOrder.find(s => s.key === key);
    return section?.title || fallback;
  };

  const isVisible = (key: string) => {
    const section = sectionOrder.find(s => s.key === key);
    return section?.visible !== false;
  };

  const renderSection = (section: HomepageSection) => {
    if (!section.visible) return null;

    switch (section.key) {
      case "hero":
        return <HeroSlider key="hero" />;
      case "personalizare":
        return <PersonalizareSection key="personalizare" />;
      case "scent_quiz":
        return <ScentQuiz key="scent_quiz" />;
      case "featured":
        return (
          <section key="featured" className="container py-8 md:py-14 px-4">
            <div className="flex items-end justify-between mb-5 md:mb-8">
              <div>
                <h2 className="font-serif text-xl md:text-2xl font-extrabold text-foreground">{getTitle("featured", "Selecția Noastră")}</h2>
                <div className="w-12 h-1 bg-primary rounded mt-2" />
              </div>
              <Link to="/catalog" className="text-xs md:text-sm text-primary hover:underline font-semibold flex items-center gap-1">
                Vezi toate <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
              </div>
            )}
          </section>
        );
      case "flash":
        return <FlashDeals key="flash" title={getTitle("flash", "Oferte Limitate")} />;
      case "social_proof":
        return <SocialProofTicker key="social_proof" />;
      case "bestsellers":
        return <BestSellers key="bestsellers" title={getTitle("bestsellers", "Cele Mai Iubite")} />;
      case "why_ventuza":
        return <WhyVentuza key="why_ventuza" />;
      case "process":
        return <ProcessSection key="process" />;
      case "testimonials":
        return <TestimonialsSection key="testimonials" />;
      case "recently_viewed":
        return <RecentlyViewed key="recently_viewed" />;
      case "newsletter":
        return <NewsletterDiscount key="newsletter" />;
      case "trust_strip":
        return <TrustFooterStrip key="trust_strip" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      {welcomeMessage && (
        <div className="bg-primary/10 border-b border-primary/20 py-3">
          <div className="container text-center text-sm font-medium text-primary">{welcomeMessage}</div>
        </div>
      )}

      {sectionOrder.map(section => renderSection(section))}

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
