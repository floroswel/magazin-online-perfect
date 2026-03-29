import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function BrandStory() {
  const ref = useScrollReveal();

  return (
    <section className="bg-background py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image */}
          <div className="reveal stagger-1">
            <div className="relative overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop"
                alt="Atelierul Mama Lucica"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Text */}
          <div className="reveal stagger-2">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6 leading-tight">
              Povestea noastră
            </h2>
            <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed mb-4">
              Mama Lucica a luat naștere dintr-o pasiune simplă: aceea de a crea momente speciale prin lumină și parfum. Fiecare lumânare este turnată manual în atelierul nostru din România, folosind exclusiv ceară de soia premium și parfumuri rare.
            </p>
            <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed mb-8">
              Credem că o lumânare bună nu doar parfumează — ea transformă un spațiu într-un refugiu. De aceea, fiecare detaliu contează, de la selecția ingredientelor până la ambalajul final.
            </p>
            <Link to="/povestea-noastra" className="btn-cta inline-flex items-center gap-2 font-sans text-sm font-medium bg-primary text-primary-foreground px-8 py-3 hover:opacity-90 transition-all">
              Află mai mult
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
