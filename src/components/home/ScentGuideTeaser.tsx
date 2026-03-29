import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const promos = [
  {
    title: "Reduceri de Primăvară",
    subtitle: "Până la -50%",
    cta: "Cumpără Acum",
    link: "/catalog?badge=deals",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=300&fit=crop",
  },
  {
    title: "Produse Noi",
    subtitle: "Descoperă Colecția",
    cta: "Vezi Noutățile",
    link: "/catalog?sort=newest",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=300&fit=crop",
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
