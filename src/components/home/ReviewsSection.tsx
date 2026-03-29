import { Star, Quote } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const reviews = [
  { name: "Maria P.", text: "Produse excelente, livrare rapidă! Recomand cu încredere.", rating: 5, city: "București" },
  { name: "Andrei M.", text: "Prețuri foarte bune comparativ cu alte platforme. Vendorii sunt serioși.", rating: 5, city: "Cluj-Napoca" },
  { name: "Elena D.", text: "Am primit coletul în 24h. Calitate la superlativ!", rating: 4, city: "Timișoara" },
  { name: "Cosmin R.", text: "Marketplace-ul perfect pentru cumpărături online. Varietate mare.", rating: 5, city: "Iași" },
];

export default function ReviewsSection() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 reveal stagger-1">
        Ce Spun Clienții Noștri
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 reveal stagger-2">
        {reviews.map((r, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className={`w-4 h-4 ${j < r.rating ? "fill-accent text-accent" : "text-border"}`} />
              ))}
            </div>
            <Quote className="w-5 h-5 text-primary/30 mb-2" />
            <p className="text-sm text-card-foreground mb-4 leading-relaxed">{r.text}</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                {r.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">{r.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
