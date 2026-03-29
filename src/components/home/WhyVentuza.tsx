import { Leaf, Hand, Palette, Truck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const reasons = [
  {
    icon: Leaf,
    title: "Ceară 100% Naturală",
    desc: "Ceară de soia premium, fără parafină sau aditivi chimici. Arde curat.",
  },
  {
    icon: Hand,
    title: "Handmade în România",
    desc: "Fiecare lumânare e turnată manual, cu atenție, în atelierul nostru.",
  },
  {
    icon: Palette,
    title: "Personalizare Completă",
    desc: "Alege aroma, culoarea, mesajul. Creăm lumânări unice pentru tine.",
  },
  {
    icon: Truck,
    title: "Livrare Rapidă & Gratuită",
    desc: "Comenzile peste 200 RON cu livrare gratuită. Ambalaj premium.",
  },
];

export default function WhyVentuza() {
  const ref = useScrollReveal();

  return (
    <section className="py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="text-center mb-12 reveal stagger-1">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">Mai mult decât o lumânare</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {reasons.map((r, i) => (
            <div key={i} className={`reveal stagger-${Math.min(i + 1, 4)} group text-center p-6 md:p-8`}>
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5">
                <r.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">{r.title}</h3>
              <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
