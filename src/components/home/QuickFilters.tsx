import { Link } from "react-router-dom";
import { Truck, Percent, Star, Coins, Flame, Gift, Sparkles, Tag } from "lucide-react";

const filters = [
  { label: "Sub 50 lei", icon: Coins, link: "/catalog?max_price=50", gradient: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/30 hover:border-emerald-500", iconColor: "text-emerald-500" },
  { label: "Reduceri > 30%", icon: Percent, link: "/oferte", gradient: "from-red-500/10 to-red-600/5", border: "border-red-500/30 hover:border-red-500", iconColor: "text-red-500" },
  { label: "Livrare mâine", icon: Truck, link: "/catalog?delivery=fast", gradient: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/30 hover:border-blue-500", iconColor: "text-blue-500" },
  { label: "Rating 4+", icon: Star, link: "/catalog?min_rating=4", gradient: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/30 hover:border-amber-500", iconColor: "text-amber-500" },
  { label: "Best Sellers", icon: Flame, link: "/catalog?sort=popular", gradient: "from-orange-500/10 to-orange-600/5", border: "border-orange-500/30 hover:border-orange-500", iconColor: "text-orange-500" },
  { label: "Noutăți", icon: Sparkles, link: "/catalog?sort=newest", gradient: "from-violet-500/10 to-violet-600/5", border: "border-violet-500/30 hover:border-violet-500", iconColor: "text-violet-500" },
  { label: "Seturi Cadou", icon: Gift, link: "/catalog?category=seturi-cadou", gradient: "from-pink-500/10 to-pink-600/5", border: "border-pink-500/30 hover:border-pink-500", iconColor: "text-pink-500" },
  { label: "Oferte Speciale", icon: Tag, link: "/oferte", gradient: "from-primary/10 to-primary/5", border: "border-primary/30 hover:border-primary", iconColor: "text-primary" },
];

export default function QuickFilters() {
  return (
    <section className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Filtre rapide</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {filters.map((f) => (
          <Link
            key={f.label}
            to={f.link}
            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${f.gradient} border ${f.border} rounded-full text-sm font-medium text-card-foreground whitespace-nowrap transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shrink-0`}
          >
            <f.icon className={`w-4 h-4 ${f.iconColor}`} />
            {f.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
