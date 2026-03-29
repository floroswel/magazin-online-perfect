import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, ShieldCheck, Flame, Users } from "lucide-react";

export default function BrandStory() {
  const ref = useScrollReveal();

  return (
    <section className="bg-card border-y border-border" ref={ref}>
      <div className="container py-8 md:py-14 px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center reveal stagger-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-card-foreground mb-4">
              Marketplace-ul Nr. 1 de Lumânări Artizanale
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Conectăm artizani pasionați cu iubitori de lumânări din toată România. 
              Fiecare lumânare este turnată manual, din ingrediente naturale, cu grija și atenția pe care le meriți.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-muted rounded-lg p-4">
                <Flame className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">50+</p>
                <p className="text-[11px] text-muted-foreground">Artizani</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">15K+</p>
                <p className="text-[11px] text-muted-foreground">Clienți Mulțumiți</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">100%</p>
                <p className="text-[11px] text-muted-foreground">Natural & Handmade</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/catalog" className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                Explorează Colecția <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/povestea-noastra" className="border border-border text-card-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-muted transition-colors">
                Povestea Noastră
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=600&h=500&fit=crop"
              alt="Lumânări artizanale handmade"
              className="w-full rounded-xl shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
