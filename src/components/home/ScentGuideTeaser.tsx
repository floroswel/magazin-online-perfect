import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const promos = [
  {
    title: "Lumânări de Sezon",
    subtitle: "Arome noi de toamnă",
    cta: "Descoperă Colecția",
    link: "/catalog?category=colectii-sezoniere",
    image: "https://images.unsplash.com/photo-1605651531144-51381895e23a?w=600&h=300&fit=crop",
  },
  {
    title: "Personalizează-ți Lumânarea",
    subtitle: "Gravură, arome, culori la alegere",
    cta: "Creează Acum",
    link: "/personalizare",
    image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=600&h=300&fit=crop",
  },
];

export default function ScentGuideTeaser() {
  const ref = useScrollReveal();

  return (
    <section className="container py-6 md:py-10 px-4" ref={ref}>
      <div className="grid md:grid-cols-2 gap-4 reveal stagger-1">
        {promos.map((promo) => (
          <Link
            key={promo.title}
            to={promo.link}
            className="group relative overflow-hidden rounded-xl h-40 md:h-52"
          >
            <img
              src={promo.image}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8">
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">{promo.subtitle}</p>
              <h3 className="text-primary-foreground text-xl md:text-2xl font-extrabold mb-3">{promo.title}</h3>
              <span className="inline-block bg-primary-foreground text-foreground font-bold text-xs px-4 py-2 rounded-md w-fit group-hover:opacity-90 transition-opacity">
                {promo.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
