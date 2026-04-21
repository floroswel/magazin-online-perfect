import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, ShieldCheck, Leaf, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartDrawer from "@/components/storefront/CartDrawer";
import { usePageSeo } from "@/components/SeoHead";
import { useThemeText } from "@/hooks/useThemeText";
import { useSettings } from "@/hooks/useSettings";
import ProductCard from "@/components/storefront/ProductCard";
import HomepageNewsletter from "@/components/storefront/HomepageNewsletter";

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

  const showHero = s.show_hero !== "false";
  const showCategories = s.show_categories !== "false";
  const showNewArrivals = s.show_new_arrivals !== "false";
  const showFeatured = s.show_featured !== "false";

  const heroTitle = t("hero_title", s.hero_title || "Ritmul lent al momentele calmă");
  const heroSubtitle = t("hero_subtitle", s.hero_subtitle || "Ceară artizanală din soia pură • Esențe sintetice rare");
  const heroCtaText = t("hero_cta_text", s.hero_cta_text || "DESCOPERĂ COLECȚIA");
  const heroCtaUrl = s.hero_cta_url || "/catalog";
  const heroImageUrl = s.hero_image_url || "";

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
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", minHeight: 420 }}>
          {heroImageUrl && (
            <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          {/* Decorative blur circles */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="ml-container py-20 lg:py-28 relative z-10">
            <p className="text-blue-300 text-sm tracking-widest uppercase mb-4">{heroSubtitle}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-8 text-white max-w-2xl">
              {heroTitle}
            </h1>
            <Link
              to={heroCtaUrl}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all rounded-md"
            >
              {heroCtaText} <ArrowRight className="w-4 h-4" />
            </Link>
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
              Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.
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
      <section className="ml-container pb-14">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Big banner */}
          <div className="md:col-span-2 relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900 to-blue-900 min-h-[220px] flex items-end p-6">
            <div className="absolute top-4 right-4 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div>
              <span className="text-blue-300 text-xs uppercase tracking-widest">COLECȚIA DE VARĂ</span>
              <h3 className="text-white text-2xl font-bold mt-1">Colecția<br/>"Nuit Étoilé"</h3>
              <Link to="/catalog" className="inline-flex items-center gap-1 text-white text-sm font-semibold mt-3 hover:underline">
                EXPLOREAZĂ → 
              </Link>
            </div>
          </div>
          {/* Small banner */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-white">
            <span className="text-xs uppercase tracking-widest opacity-80">LICHIDARE</span>
            <p className="text-lg font-bold mt-1">Stocuri limitate</p>
            <p className="text-3xl font-extrabold mt-1">De la 19 RON</p>
            <Link to="/catalog?sort=discount" className="mt-3 inline-flex items-center gap-1 bg-white text-orange-600 text-xs font-bold uppercase px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              VEZI STOCURILE
            </Link>
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ── */}
      {showFeatured && bestSellers.length > 0 && (
        <section className="py-14" style={{ background: "#f0f0f0" }}>
          <div className="ml-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold">
                {s.bestsellers_title || t("bestsellers_title", "Cele Mai Vândute")}
              </h2>
              <Link to="/catalog?featured=true" className="text-sm text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
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
      <section className="ml-container py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
            <span className="text-8xl opacity-30">🕯️</span>
          </div>
          <div>
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Povestea noastră</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Ce facem diferit este<br/>metoda și atenția cu care creăm
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural. 
              Fiecare produs este o operă de artă manuală, realizată cu respect pentru mediul tău.
            </p>
            <Link to="/page/despre-noi" className="text-blue-600 text-sm font-semibold hover:underline inline-flex items-center gap-1">
              AFLĂ MAI MULT → 
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <HomepageNewsletter />

      {/* ── EMPTY STATE ── */}
      {newProducts.length === 0 && bestSellers.length === 0 && categories.length === 0 && (
        <section className="ml-container py-20 text-center">
          <div className="max-w-md mx-auto bg-white border p-10 rounded-lg" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-6xl mb-4">🕯️</p>
            <h2 className="text-2xl font-bold mb-3">Magazinul se pregătește</h2>
            <p className="text-sm text-gray-500 mb-6">
              Adaugă produse și categorii din panoul de administrare.
            </p>
            <Link to="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-md">
              Mergi la admin
            </Link>
          </div>
        </section>
      )}

      <CartDrawer />
    </StorefrontLayout>
  );
}
