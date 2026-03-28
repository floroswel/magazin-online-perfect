import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
      <div className="text-center mb-12 reveal stagger-1">
        <p className="font-sans text-[11px] tracking-[4px] uppercase text-primary mb-3">EXPLOREAZĂ</p>
        <h2 className="font-serif text-3xl md:text-4xl text-foreground">Colecțiile noastre</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {collections.map((col, i) => (
          <Link
            key={col.name}
            to={col.slug}
            className={`reveal stagger-${i + 2} group relative overflow-hidden rounded-lg aspect-[3/4]`}
          >
            <img
              src={col.image}
              alt={col.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-colors duration-400 group-hover:from-black/70" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <h3 className="font-serif italic text-[#FAF6F0] text-xl md:text-2xl">{col.name}</h3>
              <ArrowRight className="h-5 w-5 text-[#FAF6F0]/0 group-hover:text-[#FAF6F0]/80 transition-all duration-300 translate-x-2 group-hover:translate-x-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
