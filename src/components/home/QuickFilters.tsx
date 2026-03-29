import { Link } from "react-router-dom";
import { Truck, Percent, Star, Coins, Flame, Gift, Sparkles, Tag } from "lucide-react";

const filters = [
  { label: "Sub 50 lei", icon: Coins, link: "/catalog?max_price=50" },
  { label: "Reduceri > 30%", icon: Percent, link: "/oferte" },
  { label: "Livrare mâine", icon: Truck, link: "/catalog?delivery=fast" },
  { label: "Rating 4+", icon: Star, link: "/catalog?min_rating=4" },
  { label: "Best Sellers", icon: Flame, link: "/catalog?sort=popular" },
  { label: "Noutăți", icon: Sparkles, link: "/catalog?sort=newest" },
  { label: "Seturi Cadou", icon: Gift, link: "/catalog?category=seturi-cadou" },
  { label: "Oferte Speciale", icon: Tag, link: "/oferte" },
];

export default function QuickFilters() {
  return (
    <section className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Filtre rapide</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
        {filters.map((f) => (
          <Link
            key={f.label}
            to={f.link}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-card-foreground whitespace-nowrap transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5 shrink-0 active:scale-95"
          >
            <f.icon className="w-4 h-4 text-primary" />
            {f.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
