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
    name: "Electronice",
    slug: "electronice",
    icon: "💻",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop",
    subs: [
      { name: "Telefoane", slug: "telefoane" },
      { name: "Laptopuri", slug: "laptopuri" },
      { name: "Tablete", slug: "tablete" },
      { name: "TV & Audio", slug: "tv-audio" },
      { name: "Accesorii", slug: "accesorii-electronice" },
      { name: "Gaming", slug: "gaming" },
    ],
  },
  {
    name: "Modă",
    slug: "moda",
    icon: "👗",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=200&fit=crop",
    subs: [
      { name: "Femei", slug: "moda-femei" },
      { name: "Bărbați", slug: "moda-barbati" },
      { name: "Copii", slug: "moda-copii" },
      { name: "Încălțăminte", slug: "incaltaminte" },
      { name: "Accesorii", slug: "accesorii-moda" },
    ],
  },
  {
    name: "Casa & Grădină",
    slug: "casa-gradina",
    icon: "🏠",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
    subs: [
      { name: "Mobilier", slug: "mobilier" },
      { name: "Decorațiuni", slug: "decoratiuni" },
      { name: "Bucătărie", slug: "bucatarie" },
      { name: "Grădină", slug: "gradina" },
      { name: "Iluminat", slug: "iluminat" },
    ],
  },
  {
    name: "Sport & Fitness",
    slug: "sport",
    icon: "⚽",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop",
    subs: [
      { name: "Echipament fitness", slug: "fitness" },
      { name: "Sporturi de echipă", slug: "sporturi-echipa" },
      { name: "Outdoor", slug: "outdoor" },
      { name: "Ciclism", slug: "ciclism" },
    ],
  },
  {
    name: "Auto & Moto",
    slug: "auto",
    icon: "🚗",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&h=200&fit=crop",
    subs: [
      { name: "Piese auto", slug: "piese-auto" },
      { name: "Accesorii", slug: "accesorii-auto" },
      { name: "Electronice auto", slug: "electronice-auto" },
      { name: "Curățare", slug: "curatare-auto" },
    ],
  },
  {
    name: "Copii & Bebe",
    slug: "copii",
    icon: "🧸",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=200&fit=crop",
    subs: [
      { name: "Jucării", slug: "jucarii" },
      { name: "Haine copii", slug: "haine-copii" },
      { name: "Cărucioare", slug: "carucioare" },
      { name: "Alimentație", slug: "alimentatie-copii" },
    ],
  },
  {
    name: "Sănătate",
    slug: "sanatate",
    icon: "💊",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300&h=200&fit=crop",
    subs: [
      { name: "Vitamine", slug: "vitamine" },
      { name: "Cosmetice", slug: "cosmetice" },
      { name: "Îngrijire personală", slug: "ingrijire-personala" },
      { name: "Aparatură medicală", slug: "aparatura-medicala" },
    ],
  },
  {
    name: "Cărți & Papetărie",
    slug: "carti",
    icon: "📚",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=200&fit=crop",
    subs: [
      { name: "Ficțiune", slug: "fictiune" },
      { name: "Non-ficțiune", slug: "non-fictiune" },
      { name: "Copii", slug: "carti-copii" },
      { name: "Papetărie", slug: "papetarie" },
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
