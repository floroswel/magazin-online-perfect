import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  banner_image: string | null;
  banner_link: string | null;
  parent_id: string | null;
  display_order: number;
  description: string | null;
}

interface MegaCategory {
  name: string;
  slug: string;
  icon: string;
  image: string | null;
  bannerImage: string | null;
  bannerLink: string | null;
  description: string;
  subs: { name: string; slug: string; icon?: string }[];
  productCount: number;
}

export default function MegaMenu() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [megaCategories, setMegaCategories] = useState<MegaCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, icon, image_url, banner_image, banner_link, parent_id, display_order, description")
        .eq("visible", true)
        .order("display_order", { ascending: true });

      if (!data || data.length === 0) return;
      const cats = data as Category[];
      const parents = cats.filter((c) => !c.parent_id);

      const { data: countData } = await supabase
        .from("products")
        .select("category_id")
        .eq("visible", true);

      const countMap: Record<string, number> = {};
      (countData || []).forEach((p: any) => {
        if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });

      const built: MegaCategory[] = parents.map((p) => {
        const childCats = cats.filter((c) => c.parent_id === p.id).sort((a, b) => a.display_order - b.display_order);
        const totalProducts = (countMap[p.id] || 0) + childCats.reduce((sum, c) => sum + (countMap[c.id] || 0), 0);

        return {
          name: p.name,
          slug: p.slug,
          icon: p.icon || "📦",
          image: p.image_url || null,
          bannerImage: p.banner_image,
          bannerLink: p.banner_link,
          description: p.description || "",
          subs: childCats.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon || undefined })),
          productCount: totalProducts,
        };
      });

      if (built.length > 0) setMegaCategories(built);
    };

    fetchCategories();
  }, []);

  const categories = megaCategories;
  const active = categories.find((c) => c.slug === activeCat);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className="flex bg-card border border-border rounded-b-xl shadow-2xl overflow-hidden"
      style={{ minHeight: 420 }}
      onMouseLeave={() => setActiveCat(null)}
    >
      {/* Left: category list */}
      <div className="w-60 bg-muted/40 border-r border-border py-2 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onMouseEnter={() => setActiveCat(cat.slug)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200 text-left group ${
              activeCat === cat.slug
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-card-foreground hover:bg-muted"
            }`}
          >
            <span className="text-lg leading-none">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="block truncate">{cat.name}</span>
              {cat.productCount > 0 && (
                <span className={`text-[10px] ${activeCat === cat.slug ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {cat.productCount} produse
                </span>
              )}
            </div>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              activeCat === cat.slug ? "translate-x-0.5 opacity-100" : "opacity-40"
            }`} />
          </button>
        ))}
      </div>

      {/* Right: subcategories + promo image */}
      {active ? (
        <div className="flex-1 p-6 flex gap-6 animate-fade-in" key={active.slug}>
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-card-foreground">{active.name}</h3>
              {active.description && (
                <p className="text-xs text-muted-foreground mt-1">{active.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              {active.subs.map((sub) => (
                <Link
                  key={sub.slug}
                  to={`/catalog?category=${sub.slug}`}
                  className="group/item flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {sub.icon && <span className="text-xs">{sub.icon}</span>}
                  <span className="group-hover/item:translate-x-0.5 transition-transform duration-200">{sub.name}</span>
                </Link>
              ))}
            </div>

            <Link
              to={`/catalog?category=${active.slug}`}
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold text-primary hover:gap-2.5 transition-all duration-200"
            >
              Vezi toate din {active.name}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Promo image / banner column */}
          {(active.bannerImage || active.image) && (
            <div className="w-56 shrink-0 hidden xl:flex flex-col gap-3">
              <Link
                to={active.bannerLink || `/catalog?category=${active.slug}`}
                className="group/img relative block rounded-lg overflow-hidden"
              >
                <img
                  src={(active.bannerImage || active.image)!}
                  alt={active.name}
                  className="w-full h-40 object-cover group-hover/img:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-medium">Colecția {active.name}</p>
                  <span className="text-white/80 text-[10px] flex items-center gap-1 mt-0.5">
                    Explorează <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-card-foreground">Livrare gratuită</p>
                  <p className="text-[10px] text-muted-foreground">La comenzi peste 200 lei</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 gap-3">
          <span className="text-4xl">🕯️</span>
          <p className="text-sm">Selectează o categorie pentru a vedea subcategoriile</p>
        </div>
      )}
    </div>
  );
}
