import { Truck, Leaf, RotateCcw, Headphones } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const values = [
  { icon: Truck, title: "Transport Gratuit", desc: "La comenzi peste 200 lei" },
  { icon: Leaf, title: "Produse Naturale", desc: "100% ingrediente naturale" },
  { icon: RotateCcw, title: "Retururi 30 Zile", desc: "Garanție satisfacție" },
  { icon: Headphones, title: "Suport 24/7", desc: "Suntem mereu aici" },
];

export default function SocialProofBar() {
  const ref = useScrollReveal();

  return (
    <section className="border-y border-border py-10 md:py-12" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {values.map((v, i) => (
            <div key={i} className={`reveal stagger-${Math.min(i + 1, 4)} flex flex-col items-center text-center`}>
              <v.icon className="h-7 w-7 text-primary mb-3" strokeWidth={1.5} />
              <h4 className="font-sans text-sm font-medium text-foreground mb-1">{v.title}</h4>
              <p className="font-sans text-xs text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
