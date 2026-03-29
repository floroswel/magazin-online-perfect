import { Link } from "react-router-dom";
import { Truck, Percent, Star, Coins, Flame, Gift } from "lucide-react";

const filters = [
  { label: "Sub 50 lei", icon: Coins, link: "/catalog?max_price=50", color: "text-[hsl(var(--marketplace-success))]" },
  { label: "Reduceri > 30%", icon: Percent, link: "/oferte", color: "text-primary" },
  { label: "Livrare mâine", icon: Truck, link: "/catalog?delivery=fast", color: "text-[hsl(var(--marketplace-info))]" },
  { label: "Rating 4+", icon: Star, link: "/catalog?min_rating=4", color: "text-accent" },
  { label: "Best Sellers", icon: Flame, link: "/catalog?sort=popular", color: "text-primary" },
  { label: "Seturi Cadou", icon: Gift, link: "/catalog?category=cadouri-seturi", color: "text-[hsl(var(--marketplace-success))]" },
];

export default function QuickFilters() {
  return (
    <section className="container px-4 py-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            to={f.link}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-card-foreground hover:border-primary hover:shadow-sm transition-all"
          >
            <f.icon className={`w-4 h-4 ${f.color}`} />
            {f.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
