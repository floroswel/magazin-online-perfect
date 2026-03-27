import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 39,
    badge: null,
    features: [
      "1 lumânare medie / lună",
      "Parfum surpriză selectat de noi",
      "Livrare gratuită inclusă",
      "Economie de 22%",
    ],
  },
  {
    name: "Classic",
    price: 69,
    badge: "Recomandat",
    features: [
      "2 lumânări medii / lună",
      "Tu alegi parfumul",
      "Livrare gratuită inclusă",
      "Acces anticipat la colecții noi",
    ],
  },
  {
    name: "Premium",
    price: 119,
    badge: "Cea mai bună valoare",
    features: [
      "3 lumânări + 1 produs surpriză",
      "Parfum și culoare la alegere",
      "Ambalaj premium exclusiv",
      "-20% la comenzi suplimentare",
    ],
  },
];

export default function SubscriptionSection() {
  return (
    <section className="container py-20 md:py-28">
      <div className="text-center mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Abonament Lunar</p>
        <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-3">Abonează-te și Economisești</h2>
        <p className="text-muted-foreground">Primești lunar lumânări VENTUZA la prețul tău preferat</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative p-8 border transition-all duration-300 ${plan.badge === "Recomandat" ? "border-primary" : "border-border hover:border-primary/50"}`}>
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] tracking-[0.15em] uppercase font-medium px-4 py-1">
                {plan.badge}
              </span>
            )}
            <div className="text-center mb-6">
              <h3 className="font-serif text-lg font-medium text-foreground mb-3">{plan.name}</h3>
              <div>
                <span className="font-serif text-4xl font-medium text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">RON/lună</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/abonament">
              <Button className={`w-full rounded-none text-xs tracking-[0.15em] uppercase font-medium h-11 ${plan.badge === "Recomandat" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent border border-foreground/20 text-foreground hover:bg-foreground/5"}`}>
                Abonează-te
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
