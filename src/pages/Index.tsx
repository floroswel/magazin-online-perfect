import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartDrawer from "@/components/storefront/CartDrawer";
import { usePageSeo } from "@/components/SeoHead";
import { useThemeText } from "@/hooks/useThemeText";
import { useSettings } from "@/hooks/useSettings";
import ProductCard from "@/components/storefront/ProductCard";
import HomepageNewsletter from "@/components/storefront/HomepageNewsletter";
import HomeCategorySidebar from "@/components/storefront/HomeCategorySidebar";

const unq = (str?: string) => (str || "").replace(/^"|"$/g, "");

export default function Index() {
  const { t } = useThemeText();
  const { settings: s } = useSettings();

  usePageSeo({
    title: t("seo_home_title", "Mama Lucica · Lumânări handmade din ceară de soia | Made in Romania"),
    description: t("seo_home_description", "Lumânări parfumate 100% handmade, turnate manual din ceară de soia. Livrare 24-48h în toată România."),
  });

  const { data: newProducts = [], isLoading: loadingNew } = useQuery({
    queryKey: ["home-new-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: bestSellers = [], isLoading: loadingBest } = useQuery({
    queryKey: ["home-bestsellers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .eq("status", "active")
        .eq("featured", true)
        .limit(8);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, description")
        .eq("visible", true)
        .is("parent_id", null)
        .order("display_order")
        .limit(6);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Visibility toggles
  const showHero = s.show_hero !== "false";
  const showCategories = s.show_categories !== "false";
  const showNewArrivals = s.show_new_arrivals !== "false";
  const showFeatured = s.show_featured !== "false";
  const showBanners = s.homepage_show_banners !== "false";
  const showBrandStory = s.homepage_show_brand_story !== "false";
  const showBenefits = s.show_benefits !== "false";
  const showMidBanner = s.show_mid_banner === "true";
  const showNewsletter = s.show_newsletter !== "false";
  const categoriesCount = parseInt(unq(s.categories_count) || "6", 10);
  const newArrivalsCount = parseInt(unq(s.new_arrivals_count) || "8", 10);
  const featuredCount = parseInt(unq(s.featured_count) || "8", 10);

  // Hero
  const heroTitle = t("hero_title", s.hero_title || "Ritmul lent al momentele calmă");
  const heroSubtitle = t("hero_subtitle", s.hero_subtitle || "Ceară artizanală din soia pură • Esențe sintetice rare");
  const heroCtaText = t("hero_cta_text", s.hero_cta_text || "DESCOPERĂ COLECȚIA");
  const heroCtaUrl = unq(s.hero_cta_url) || "/catalog";
  const heroImageUrl = unq(s.hero_image_url) || "";
  const heroGradientStart = unq(s.theme_hero_gradient_start) || "#1a1a2e";
  const heroGradientMid = unq(s.theme_hero_gradient_mid) || "#16213e";
  const heroGradientEnd = unq(s.theme_hero_gradient_end) || "#0f3460";
  const primaryColor = unq(s.primary_color) || unq(s.theme_primary_color) || "#2563eb";

  // Products section
  const productsDescription = unq(s.homepage_products_description) || "Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.";

  // Banner 1
  const b1Label = unq(s.homepage_banner1_label) || "COLECȚIA DE VARĂ";
  const b1Title = unq(s.homepage_banner1_title) || 'Colecția "Nuit Étoilé"';
  const b1Cta = unq(s.homepage_banner1_cta) || "EXPLOREAZĂ →";
  const b1Url = unq(s.homepage_banner1_url) || "/catalog";
  const b1Image = unq(s.homepage_banner1_image);
  const b1From = unq(s.homepage_banner1_gradient_from) || "#312e81";
  const b1To = unq(s.homepage_banner1_gradient_to) || "#1e3a5f";

  // Banner 2
  const b2Label = unq(s.homepage_banner2_label) || "LICHIDARE";
  const b2Subtitle = unq(s.homepage_banner2_subtitle) || "Stocuri limitate";
  const b2Price = unq(s.homepage_banner2_price) || "De la 19 RON";
  const b2Cta = unq(s.homepage_banner2_cta) || "VEZI STOCURILE";
  const b2Url = unq(s.homepage_banner2_url) || "/catalog?sort=discount";
  const b2From = unq(s.homepage_banner2_gradient_from) || "#f97316";
  const b2To = unq(s.homepage_banner2_gradient_to) || "#ef4444";

  // Brand story
  const brandLabel = unq(s.homepage_brand_label) || "Povestea noastră";
  const brandTitle = unq(s.homepage_brand_title) || "Ce facem diferit este metoda și atenția cu care creăm";
  const brandText = unq(s.homepage_brand_text) || "Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural. Fiecare produs este o operă de artă manuală, realizată cu respect pentru mediul tău.";
  const brandCta = unq(s.homepage_brand_cta) || "AFLĂ MAI MULT →";
  const brandUrl = unq(s.homepage_brand_url) || "/page/despre-noi";
  const brandImage = unq(s.homepage_brand_image);

  const SkeletonGrid = ({ count = 8 }: { count?: number }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  );

  return (
    <StorefrontLayout>
      {/* ── HERO ── */}
      {showHero && (
        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${heroGradientStart} 0%, ${heroGradientMid} 50%, ${heroGradientEnd} 100%)`,
            minHeight: 420,
          }}
        >
          {heroImageUrl && (
            <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: `${primaryColor}33` }} />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-3xl" style={{ background: `${primaryColor}15` }} />

          <div className="ml-container py-20 lg:py-28 relative z-10">
            <p className="text-sm tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>{heroSubtitle}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-8 text-white max-w-2xl">
              {heroTitle}
            </h1>
            <div className="flex flex-wrap gap-4">
              <Link
                to={heroCtaUrl}
                className="inline-flex items-center gap-2 px-8 py-4 text-white text-sm font-bold uppercase tracking-widest transition-all rounded-md"
                style={{ background: primaryColor }}
              >
                {heroCtaText} <ArrowRight className="w-4 h-4" />
              </Link>
              {unq(s.hero_show_second_btn) === "true" && (
                <Link
                  to={unq(s.hero_second_btn_url) || "/page/despre-noi"}
                  className="inline-flex items-center gap-2 px-8 py-4 text-white text-sm font-bold uppercase tracking-widest transition-all rounded-md border border-white/30 hover:bg-white/10"
                >
                  {unq(s.hero_second_btn_text) || "Povestea noastră"}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES GRID ── */}
      {showCategories && categories.length > 0 && (
        <section className="ml-container py-14">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
            {unq(s.categories_title) || t("categories_title", "Categoriile Noastre")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.slice(0, categoriesCount).map((cat: any) => (
              <Link key={cat.id} to={`/catalog/${cat.slug}`} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] flex items-end">
                {cat.image_url && <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                <div className="relative z-10 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-white font-bold text-sm">{cat.name}</h3>
                  {cat.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PRODUSE POPULARE ── */}
      {showNewArrivals && (
        <section className="ml-container py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
              {s.new_arrivals_title || t("new_arrivals_title", "Preferatele clienților")}
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              {productsDescription}
            </p>
          </div>
          {loadingNew ? <SkeletonGrid /> : newProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {newProducts.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : null}
        </section>
      )}

      {/* ── BANNER DUO ── */}
      {showBanners && (
        <section className="ml-container pb-14">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Big banner */}
            <div
              className="md:col-span-2 relative rounded-xl overflow-hidden min-h-[220px] flex items-end p-6"
              style={{ background: `linear-gradient(135deg, ${b1From}, ${b1To})` }}
            >
              {b1Image && <img src={b1Image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
              <div className="absolute top-4 right-4 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-white/30" />
                <div className="w-2 h-2 rounded-full bg-white/30" />
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="relative z-10">
                <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(200,220,255,0.8)" }}>{b1Label}</span>
                <h3 className="text-white text-2xl font-bold mt-1">{b1Title}</h3>
                <Link to={b1Url} className="inline-flex items-center gap-1 text-white text-sm font-semibold mt-3 hover:underline">
                  {b1Cta}
                </Link>
              </div>
            </div>
            {/* Small banner */}
            <div
              className="relative rounded-xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-white"
              style={{ background: `linear-gradient(135deg, ${b2From}, ${b2To})` }}
            >
              <span className="text-xs uppercase tracking-widest opacity-80">{b2Label}</span>
              <p className="text-lg font-bold mt-1">{b2Subtitle}</p>
              <p className="text-3xl font-extrabold mt-1">{b2Price}</p>
              <Link to={b2Url} className="mt-3 inline-flex items-center gap-1 bg-white text-xs font-bold uppercase px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" style={{ color: b2From }}>
                {b2Cta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BESTSELLERS ── */}
      {showFeatured && bestSellers.length > 0 && (
        <section className="py-14" style={{ background: unq(s.background_color) || "#f5f5f5" }}>
          <div className="ml-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold">
                {s.bestsellers_title || t("bestsellers_title", "Cele Mai Vândute")}
              </h2>
              <Link to="/catalog?featured=true" className="text-sm font-semibold hover:underline inline-flex items-center gap-1" style={{ color: primaryColor }}>
                Vezi toate <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loadingBest ? <SkeletonGrid /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {bestSellers.map((p: any) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── BRAND STORY ── */}
      {showBrandStory && (
        <section className="ml-container py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
              {brandImage ? (
                <img src={brandImage} alt={brandLabel} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl opacity-30">🕯️</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>{brandLabel}</p>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">{brandTitle}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{brandText}</p>
              <Link to={brandUrl} className="text-sm font-semibold hover:underline inline-flex items-center gap-1" style={{ color: primaryColor }}>
                {brandCta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── DE CE MAMA LUCICA (Benefits) ── */}
      {showBenefits && (
        <section className="py-14" style={{ background: "#faf8f5" }}>
          <div className="ml-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[1, 2, 3, 4].map(i => {
                const icon = unq(s[`benefit_${i}_icon`]) || "✨";
                const title = unq(s[`benefit_${i}_title`]) || "";
                const subtitle = unq(s[`benefit_${i}_subtitle`]) || "";
                if (!title) return null;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{icon}</span>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── MID BANNER ── */}
      {showMidBanner && (
        <section className="ml-container py-6">
          <Link
            to={unq(s.mid_banner_url) || "#"}
            className="block relative rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center text-white text-center"
            style={{ background: unq(s.mid_banner_bg) || "#2563eb" }}
          >
            {unq(s.mid_banner_image) && (
              <img src={unq(s.mid_banner_image)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="relative z-10 p-6">
              <h3 className="text-2xl font-bold">{unq(s.mid_banner_text) || "Ofertă Specială"}</h3>
            </div>
          </Link>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      {showNewsletter && <HomepageNewsletter />}

      {/* ── EMPTY STATE ── */}
      {newProducts.length === 0 && bestSellers.length === 0 && categories.length === 0 && (
        <section className="ml-container py-20 text-center">
          <div className="max-w-md mx-auto bg-white border p-10 rounded-lg" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-6xl mb-4">🕯️</p>
            <h2 className="text-2xl font-bold mb-3">Magazinul se pregătește</h2>
            <p className="text-sm text-gray-500 mb-6">
              Adaugă produse și categorii din panoul de administrare.
            </p>
            <Link to="/admin" className="inline-flex items-center gap-2 px-6 py-3 text-white text-xs font-bold uppercase tracking-wide rounded-md" style={{ background: primaryColor }}>
              Mergi la admin
            </Link>
          </div>
        </section>
      )}

      <CartDrawer />
    </StorefrontLayout>
  );
}
