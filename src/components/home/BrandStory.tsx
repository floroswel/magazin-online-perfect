import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, ShieldCheck, Store, Users } from "lucide-react";

export default function BrandStory() {
  const ref = useScrollReveal();

  return (
    <section className="bg-card border-y border-border" ref={ref}>
      <div className="container py-8 md:py-14 px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center reveal stagger-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-card-foreground mb-4">
              Marketplace-ul Nr. 1 din România
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Alătură-te celor peste 10.000 de vendori și milioane de cumpărători care folosesc platforma noastră. 
              Cele mai bune prețuri, garanție de calitate și livrare rapidă în toată țara.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-muted rounded-lg p-4">
                <Store className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">10K+</p>
                <p className="text-[11px] text-muted-foreground">Vendori</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">2M+</p>
                <p className="text-[11px] text-muted-foreground">Clienți</p>
              </div>
              <div className="text-center bg-muted rounded-lg p-4">
                <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-card-foreground">100%</p>
                <p className="text-[11px] text-muted-foreground">Securizat</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/catalog" className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                Începe Cumpărăturile <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/povestea-noastra" className="border border-border text-card-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-muted transition-colors">
                Află Mai Multe
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=500&fit=crop"
              alt="Marketplace"
              className="w-full rounded-xl shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
