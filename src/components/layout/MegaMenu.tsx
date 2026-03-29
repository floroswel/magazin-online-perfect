import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface SubCategory {
  name: string;
  slug: string;
}

interface MegaCategory {
  name: string;
  slug: string;
  icon: string;
  image: string;
  subs: SubCategory[];
}

const megaCategories: MegaCategory[] = [
  {
    name: "Lumânări Parfumate",
    slug: "lumanari-parfumate",
    icon: "🕯️",
    image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=300&h=200&fit=crop",
    subs: [
      { name: "Lumânări din Soia", slug: "lumanari-soia" },
      { name: "Lumânări din Ceară de Albine", slug: "lumanari-ceara-albine" },
      { name: "Lumânări din Parafină", slug: "lumanari-parafina" },
      { name: "Lumânări cu Uleiuri Esențiale", slug: "lumanari-uleiuri-esentiale" },
      { name: "Lumânări de Lux", slug: "lumanari-lux" },
      { name: "Lumânări Naturale", slug: "lumanari-naturale" },
    ],
  },
  {
    name: "Lumânări Decorative",
    slug: "lumanari-decorative",
    icon: "✨",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=200&fit=crop",
    subs: [
      { name: "Lumânări Sculptate", slug: "lumanari-sculptate" },
      { name: "Lumânări în Forme", slug: "lumanari-forme" },
      { name: "Lumânări Colorate", slug: "lumanari-colorate" },
      { name: "Lumânări Rustice", slug: "lumanari-rustice" },
      { name: "Lumânări cu Flori Uscate", slug: "lumanari-flori" },
    ],
  },
  {
    name: "Cadouri & Seturi",
    slug: "cadouri-seturi",
    icon: "🎁",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=200&fit=crop",
    subs: [
      { name: "Seturi Cadou", slug: "seturi-cadou" },
      { name: "Cutii Premium", slug: "cutii-premium" },
      { name: "Cadouri Personalizate", slug: "cadouri-personalizate" },
      { name: "Gift Cards", slug: "gift-cards" },
    ],
  },
  {
    name: "Aromaterapie",
    slug: "aromaterapie",
    icon: "🌿",
    image: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=300&h=200&fit=crop",
    subs: [
      { name: "Difuzoare & Arome", slug: "difuzoare-arome" },
      { name: "Uleiuri Esențiale", slug: "uleiuri-esentiale" },
      { name: "Bețișoare Parfumate", slug: "betisoare-parfumate" },
      { name: "Ceară pentru Difuzor", slug: "ceara-difuzor" },
    ],
  },
  {
    name: "Lumânări de Eveniment",
    slug: "lumanari-eveniment",
    icon: "🎉",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&h=200&fit=crop",
    subs: [
      { name: "Lumânări Botez", slug: "lumanari-botez" },
      { name: "Lumânări Nuntă", slug: "lumanari-nunta" },
      { name: "Lumânări Aniversare", slug: "lumanari-aniversare" },
      { name: "Comenzi Corporate", slug: "comenzi-corporate" },
    ],
  },
  {
    name: "Personalizare",
    slug: "personalizare",
    icon: "🎨",
    image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=300&h=200&fit=crop",
    subs: [
      { name: "Gravură Laser", slug: "gravura-laser" },
      { name: "Etichete Custom", slug: "etichete-custom" },
      { name: "Arome la Cerere", slug: "arome-cerere" },
      { name: "Culori Personalizate", slug: "culori-personalizate" },
    ],
  },
  {
    name: "Accesorii",
    slug: "accesorii",
    icon: "🔧",
    image: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=300&h=200&fit=crop",
    subs: [
      { name: "Suporturi Lumânări", slug: "suporturi" },
      { name: "Fitiluri & Materiale", slug: "fitiluri-materiale" },
      { name: "Capace & Stingătoare", slug: "capace-stingatoare" },
      { name: "Kituri DIY", slug: "kituri-diy" },
    ],
  },
  {
    name: "Colecții Sezoniere",
    slug: "colectii-sezoniere",
    icon: "🍂",
    image: "https://images.unsplash.com/photo-1605651531144-51381895e23a?w=300&h=200&fit=crop",
    subs: [
      { name: "Colecția de Crăciun", slug: "craciun" },
      { name: "Colecția de Vară", slug: "vara" },
      { name: "Colecția de Toamnă", slug: "toamna" },
      { name: "Ediții Limitate", slug: "editii-limitate" },
    ],
  },
];

export default function MegaMenu() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const active = megaCategories.find((c) => c.slug === activeCat);

  return (
    <div
      className="flex bg-card border border-border rounded-b-lg shadow-2xl overflow-hidden"
      style={{ minHeight: 380 }}
      onMouseLeave={() => setActiveCat(null)}
    >
      {/* Left: category list */}
      <div className="w-56 bg-muted/60 border-r border-border py-1 shrink-0">
        {megaCategories.map((cat) => (
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
