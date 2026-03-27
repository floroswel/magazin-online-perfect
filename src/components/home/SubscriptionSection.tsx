import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "STARTER",
    price: 39,
    badge: null,
    features: [
      "1 lumânare medie/lună (valoare 50 RON)",
      "Parfum ales de noi (surpriză)",
      "Livrare gratuită",
      "-22% față de prețul normal",
    ],
  },
  {
    name: "CLASSIC",
    price: 69,
    badge: "Popular",
    features: [
      "2 lumânări medii/lună",
      "Tu alegi parfumul",
      "Livrare gratuită",
      "Acces early la colecții noi",
    ],
  },
  {
    name: "PREMIUM",
    price: 119,
    badge: "Best Value",
    features: [
      "3 lumânări + 1 produs surpriză",
      "Parfum + culoare la alegere",
      "Ambalaj premium",
      "-20% la orice comandă suplimentară",
    ],
  },
];

export default function SubscriptionSection() {
  return (
    <section className="container py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">🔄 Abonează-te și Economisești</h2>
        <p className="text-muted-foreground mt-2">Primești lunar o lumânare surpriză VENTUZA la prețul tău preferat</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.badge === "Popular" ? "border-primary shadow-lg" : ""}`}>
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                {plan.badge}
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm"> RON/lună</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/abonament">
                <Button className="w-full mt-4" variant={plan.badge === "Popular" ? "default" : "outline"}>
                  Abonează-te
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
