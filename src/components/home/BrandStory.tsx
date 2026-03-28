import { Link } from "react-router-dom";
import { Leaf, Hand, Recycle } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function BrandStory() {
  const ref = useScrollReveal();

  return (
    <section className="bg-background py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 items-center">
          {/* Image */}
          <div className="lg:col-span-3 reveal stagger-1">
            <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop"
                alt="Atelierul VENTUZA"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-2 reveal stagger-2">
            <p className="font-sans text-[11px] tracking-[4px] uppercase text-primary mb-4">POVESTEA NOASTRĂ</p>
            <h2 className="font-serif italic text-3xl md:text-4xl text-foreground mb-6 leading-tight">
              Creăm momente, nu doar lumânări
            </h2>
            <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed mb-4">
              Fiecare lumânare VENTUZA este turnată manual în atelierul nostru din România, folosind exclusiv ceară de soia premium și parfumuri rare din Grasse, Franța.
            </p>
            <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed mb-8">
              Credem că o lumânare bună nu doar parfumează — ea transformă un spațiu într-un refugiu. De aceea, fiecare detaliu contează.
            </p>
            <Link to="/povestea-noastra" className="inline-flex items-center gap-2 font-sans text-sm text-primary hover:text-ventuza-amber-dark transition-colors group">
              Află mai mult
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            {/* Values */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border">
              {[
                { icon: Leaf, label: "Ingrediente\nNaturale" },
                { icon: Hand, label: "Artizanat\nRomânesc" },
                { icon: Recycle, label: "Ambalaje\nEco" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon className="h-5 w-5 text-ventuza-sage mx-auto mb-2" strokeWidth={1.5} />
                  <p className="font-sans text-[11px] text-muted-foreground whitespace-pre-line leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
