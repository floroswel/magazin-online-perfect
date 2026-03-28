import { Star } from "lucide-react";

const stats = [
  { label: "Rating", value: "4.9", icon: <Star className="h-3.5 w-3.5 fill-primary text-primary" /> },
  { label: "Comenzi", value: "12.000+" },
  { label: "Natural", value: "100%" },
  { label: "Livrare", value: "24-48h" },
];

export default function SocialProofBar() {
  return (
    <section className="bg-secondary border-y border-border">
      <div className="container py-5 px-4">
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              {stat.icon}
              <span className="font-serif text-lg font-normal text-foreground">{stat.value}</span>
              <span className="font-sans text-xs text-muted-foreground tracking-wide">{stat.label}</span>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px h-5 bg-border ml-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
