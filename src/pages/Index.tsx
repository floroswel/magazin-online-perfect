import { Link } from "react-router-dom";
import { Flame, Leaf, Award, Sparkles, ArrowRight, Star, Truck, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartDrawer from "@/components/storefront/CartDrawer";
import { usePageSeo } from "@/components/SeoHead";
import { useThemeText } from "@/hooks/useThemeText";
import { useSettings } from "@/hooks/useSettings";
import ProductCard from "@/components/storefront/ProductCard";

export default function Index() {
  const { t } = useThemeText();
  const { settings: s } = useSettings();

  usePageSeo({
    title: t("seo_home_title", "Mama Lucica · Lumânări handmade din ceară de soia | Made in Romania"),
    description: t(
      "seo_home_description",
      "Lumânări parfumate 100% handmade, turnate manual din ceară de soia. Livrare 24-48h în toată România."
    ),
  });

  // ── Real data from Supabase ──
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
        .limit(8);
      return data || [];
    },
    staleTime: 60_000,
  });

  const SkeletonGrid = ({ count = 8, aspect = "aspect-[3/4]" }: { count?: number; aspect?: string }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${aspect} bg-muted animate-pulse rounded-sm`} />
      ))}
    </div>
  );

  const showHero = s.show_hero !== "false";
  const showCategories = s.show_categories !== "false";
  const showNewArrivals = s.show_new_arrivals !== "false";
  const showFeatured = s.show_featured !== "false";

  const heroTitle = t("hero_title", s.hero_title || "Lumânări turnate cu suflet, niciodată în serie.");
  const heroSubtitle = t("hero_subtitle", s.hero_subtitle || "Ceară de soia 100% naturală. Parfumuri compuse manual. Fiecare lumânare poartă numele unui artizan și data turnării.");
  const heroCtaText = t("hero_cta_text", s.hero_cta_text || "Descoperă colecția");
  const heroCtaUrl = s.hero_cta_url || "/catalog";
  const heroImageUrl = s.hero_image_url || "";
  const categoriesTitle = s.categories_title || t("categories_title", "Categorii");
  const newArrivalsTitle = s.new_arrivals_title || t("new_arrivals_title", "Produse Noi");
  const bestsellersTitle = s.bestsellers_title || t("bestsellers_title", "Cele Mai Vândute");

  return (
    <StorefrontLayout>
      {/* ───────────── HERO ───────────── */}
      {showHero && (
        <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
          {heroImageUrl && (
            <img
              src={heroImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="ml-container py-16 lg:py-24 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {heroTitle}
              </h1>
              <p className="text-base lg:text-lg opacity-90 leading-relaxed mb-8 max-w-lg">
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={heroCtaUrl}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-sm"
                >
                  {heroCtaText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/page/despre-noi"
                  className="inline-flex items-center px-8 py-4 border border-current rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                >
                  {t("hero_cta_secondary", "Povestea noastră")}
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              {heroImageUrl ? (
                <img src={heroImageUrl} alt="" className="max-h-96 object-contain rounded-sm" />
              ) : (
                <div className="text-[160px] select-none animate-pulse">🕯️</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───────────── VALUES BAR ───────────── */}
      <section className="bg-muted border-y border-border py-6">
        <div className="ml-container grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Leaf, title: t("values_1_title", "Ceară de soia"), sub: t("values_1_sub", "100% naturală") },
            { icon: Flame, title: t("values_2_title", "Ardere curată"), sub: t("values_2_sub", "Până la 60h") },
            { icon: Truck, title: t("values_3_title", "Livrare rapidă"), sub: t("values_3_sub", "24-48h în România") },
            { icon: ShieldCheck, title: t("values_4_title", "Plată securizată"), sub: t("values_4_sub", "Visa / Mastercard") },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── CATEGORII ───────────── */}
      {showCategories && categories.length > 0 && (
        <section className="ml-container py-14">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-8 text-center">
            {categoriesTitle}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/categorie/${cat.slug}`}
                className="group relative aspect-[4/3] bg-muted rounded-sm overflow-hidden border border-border hover:border-primary transition-colors"
              >
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🕯️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────────── PRODUSE NOI ───────────── */}
      {showNewArrivals && newProducts.length > 0 && (
        <section className="ml-container py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl lg:text-3xl font-bold">{newArrivalsTitle}</h2>
            <Link to="/catalog?sort=newest" className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">
              Vezi toate <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newProducts.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────── BESTSELLERS ───────────── */}
      {showFeatured && bestSellers.length > 0 && (
        <section className="bg-muted/50 py-14">
          <div className="ml-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl lg:text-3xl font-bold">{bestsellersTitle}</h2>
              <Link to="/catalog?featured=true" className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Vezi toate <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map((p: any) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────── EMPTY STATE ───────────── */}
      {newProducts.length === 0 && bestSellers.length === 0 && categories.length === 0 && (
        <section className="ml-container py-20 text-center">
          <div className="max-w-md mx-auto bg-card border border-border p-10 rounded-sm">
            <p className="text-6xl mb-4">🕯️</p>
            <h2 className="font-display text-2xl mb-3">Magazinul se pregătește</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Adaugă produse și categorii din panoul de administrare pentru a le vedea aici.
            </p>
            <Link to="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-wide">
              Mergi la admin
            </Link>
          </div>
        </section>
      )}

      <CartDrawer />
    </StorefrontLayout>
  );
}
