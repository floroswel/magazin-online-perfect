import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const collections = [
  {
    name: "Lumânări Parfumate",
    slug: "/catalog?category=parfumate",
    image: "https://images.unsplash.com/photo-1602607753498-2e513137e061?w=600&h=600&fit=crop",
  },
  {
    name: "Seturi Cadou",
    slug: "/catalog?category=seturi-cadou",
    image: "https://images.unsplash.com/photo-1543248939-4296e1fea89b?w=600&h=600&fit=crop",
  },
  {
    name: "Personalizate",
    slug: "/personalizare",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&h=600&fit=crop",
  },
  {
    name: "Toate produsele",
    slug: "/catalog",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop",
  },
];

export default function CollectionsGrid() {
  const ref = useScrollReveal();

  return (
    <section className="container py-16 md:py-24 px-4" ref={ref}>
      <div className="text-center mb-12 reveal stagger-1">
        <h2 className="font-serif text-3xl md:text-4xl text-foreground">Colecțiile noastre</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((col, i) => (
          <Link
            key={col.name}
            to={col.slug}
            className={`reveal stagger-${Math.min(i + 2, 4)} group relative overflow-hidden aspect-square`}
          >
            <img
              src={col.image}
              alt={col.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="font-serif text-white text-lg md:text-xl text-center px-2">{col.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
