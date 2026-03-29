import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
}

interface MegaCategory {
  name: string;
  slug: string;
  icon: string;
  image: string;
  subs: { name: string; slug: string }[];
}

const FALLBACK_IMAGES: Record<string, string> = {
  "lumanari-parfumate": "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=300&h=200&fit=crop",
  "lumanari-decorative": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=200&fit=crop",
  "cadouri-seturi": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=200&fit=crop",
  "aromaterapie": "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=300&h=200&fit=crop",
};

const FALLBACK_ICONS: Record<string, string> = {
  "lumanari-parfumate": "🕯️",
  "lumanari-decorative": "✨",
  "cadouri-seturi": "🎁",
  "aromaterapie": "🌿",
  "lumanari-eveniment": "🎉",
  "personalizare": "🎨",
  "accesorii": "🔧",
  "colectii-sezoniere": "🍂",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=300&h=200&fit=crop";

export default function MegaMenu() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [megaCategories, setMegaCategories] = useState<MegaCategory[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug, icon, image_url, parent_id, display_order")
      .eq("visible", true)
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const cats = data as Category[];
        const parents = cats.filter((c) => !c.parent_id);
        const built: MegaCategory[] = parents.map((p) => ({
          name: p.name,
          slug: p.slug,
          icon: p.icon || FALLBACK_ICONS[p.slug] || "📦",
          image: p.image_url || FALLBACK_IMAGES[p.slug] || DEFAULT_IMAGE,
          subs: cats
            .filter((c) => c.parent_id === p.id)
            .sort((a, b) => a.display_order - b.display_order)
            .map((c) => ({ name: c.name, slug: c.slug })),
        }));
        if (built.length > 0) setMegaCategories(built);
      });
  }, []);

  // Fallback if DB is empty
  const categories = megaCategories.length > 0 ? megaCategories : [
    { name: "Lumânări Parfumate", slug: "lumanari-parfumate", icon: "🕯️", image: FALLBACK_IMAGES["lumanari-parfumate"]!, subs: [{ name: "Din Soia", slug: "lumanari-soia" }, { name: "Din Ceară de Albine", slug: "lumanari-ceara-albine" }, { name: "Uleiuri Esențiale", slug: "lumanari-uleiuri-esentiale" }, { name: "De Lux", slug: "lumanari-lux" }] },
    { name: "Lumânări Decorative", slug: "lumanari-decorative", icon: "✨", image: FALLBACK_IMAGES["lumanari-decorative"]!, subs: [{ name: "Sculptate", slug: "lumanari-sculptate" }, { name: "Colorate", slug: "lumanari-colorate" }, { name: "Cu Flori Uscate", slug: "lumanari-flori" }] },
    { name: "Cadouri & Seturi", slug: "cadouri-seturi", icon: "🎁", image: FALLBACK_IMAGES["cadouri-seturi"]!, subs: [{ name: "Seturi Cadou", slug: "seturi-cadou" }, { name: "Gift Cards", slug: "gift-cards" }] },
    { name: "Aromaterapie", slug: "aromaterapie", icon: "🌿", image: FALLBACK_IMAGES["aromaterapie"]!, subs: [{ name: "Difuzoare", slug: "difuzoare-arome" }, { name: "Bețișoare", slug: "betisoare-parfumate" }] },
    { name: "Eveniment", slug: "lumanari-eveniment", icon: "🎉", image: DEFAULT_IMAGE, subs: [{ name: "Botez", slug: "lumanari-botez" }, { name: "Nuntă", slug: "lumanari-nunta" }] },
    { name: "Personalizare", slug: "personalizare", icon: "🎨", image: DEFAULT_IMAGE, subs: [{ name: "Gravură Laser", slug: "gravura-laser" }, { name: "Etichete Custom", slug: "etichete-custom" }] },
    { name: "Accesorii", slug: "accesorii", icon: "🔧", image: DEFAULT_IMAGE, subs: [{ name: "Suporturi", slug: "suporturi" }, { name: "Kituri DIY", slug: "kituri-diy" }] },
  ];

  const active = categories.find((c) => c.slug === activeCat);

  return (
    <div
      className="flex bg-card border border-border rounded-b-lg shadow-2xl overflow-hidden"
      style={{ minHeight: 380 }}
      onMouseLeave={() => setActiveCat(null)}
    >
      {/* Left: category list */}
      <div className="w-56 bg-muted/60 border-r border-border py-1 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onMouseEnter={() => setActiveCat(cat.slug)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
              activeCat === cat.slug
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-card-foreground hover:bg-muted"
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span className="flex-1">{cat.name}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        ))}
      </div>

      {/* Right: subcategories + promo image */}
      {active && (
        <div className="flex-1 p-6 flex gap-8 animate-fade-in">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-card-foreground mb-4">{active.name}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {active.subs.map((sub) => (
                <Link
                  key={sub.slug}
                  to={`/catalog?category=${sub.slug}`}
                  className="py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
            <Link
              to={`/catalog?category=${active.slug}`}
              className="inline-block mt-6 text-sm font-semibold text-primary hover:underline"
            >
              Vezi toate din {active.name} →
            </Link>
          </div>
          <div className="w-64 shrink-0 hidden xl:block">
            <img
              src={active.image}
              alt={active.name}
              className="w-full h-44 object-cover rounded-lg"
              loading="lazy"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">Descoperă colecția {active.name}</p>
          </div>
        </div>
      )}

      {!active && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
          ← Selectează o categorie pentru a vedea subcategoriile
        </div>
      )}
    </div>
  );
}
