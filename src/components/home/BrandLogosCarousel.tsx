import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Shield, Truck, CreditCard, RotateCcw } from "lucide-react";

const guarantees = [
  { icon: Shield, title: "Garanție Autenticitate", desc: "Produse originale, 100% verificate" },
  { icon: Truck, title: "Livrare Rapidă", desc: "Comandă azi, primește mâine" },
  { icon: CreditCard, title: "Plată Securizată", desc: "Criptare SSL de nivel bancar" },
  { icon: RotateCcw, title: "Retur Simplu", desc: "30 de zile, fără întrebări" },
];

export default function BrandLogosCarousel() {
  const ref = useScrollReveal();

  return (
    <section className="bg-muted py-8 md:py-12" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 reveal stagger-1">
          {guarantees.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-card mx-auto mb-3 flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{g.title}</h4>
                <p className="text-[11px] text-muted-foreground">{g.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
