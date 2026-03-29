import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const collections = [
  {
    name: "Lumânări Parfumate",
    slug: "/catalog?category=parfumate",
    image: "https://images.unsplash.com/photo-1602607753498-2e513137e061?w=600&h=800&fit=crop",
  },
  {
    name: "Seturi Cadou",
    slug: "/catalog?category=seturi-cadou",
    image: "https://images.unsplash.com/photo-1543248939-4296e1fea89b?w=600&h=800&fit=crop",
  },
  {
    name: "Personalizate",
    slug: "/personalizare",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&h=800&fit=crop",
  },
];

export default function CollectionsGrid() {
  const ref = useScrollReveal();

  return (
    <section className="container py-16 md:py-24 px-4" ref={ref}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collections.map((col, i) => (
          <Link
            key={col.name}
            to={col.slug}
            className={`reveal stagger-${Math.min(i + 1, 4)} group relative overflow-hidden`}
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="pt-4 pb-2 text-center">
              <h3 className="font-sans text-[12px] font-medium tracking-[2px] uppercase text-foreground group-hover:text-primary transition-colors">
                {col.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
