import { Truck, Shield, RotateCcw, Headphones, CreditCard, Award } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  { icon: Truck, label: "Livrare Gratuită", desc: "La comenzi peste 200 lei" },
  { icon: Shield, label: "Plată Securizată", desc: "100% protejat" },
  { icon: RotateCcw, label: "Retur Gratuit", desc: "30 zile garanție" },
  { icon: Headphones, label: "Suport 24/7", desc: "Asistență non-stop" },
  { icon: CreditCard, label: "Rate fără Dobândă", desc: "Până la 12 rate" },
  { icon: Award, label: "Calitate Premium", desc: "Vendori verificați" },
];

export default function SocialProofBar() {
  const ref = useScrollReveal();

  return (
    <section className="bg-card border-b border-border py-4 md:py-6" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 reveal stagger-1">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-card-foreground leading-tight">{f.label}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
