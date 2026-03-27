import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const features = [
  "Minim 10 buc",
  "Logo pe lumânare/ambalaj",
  "Parfumuri personalizate",
  "Livrare în toată România",
  "Factură fiscală",
  "Termen: 7-14 zile",
];

export default function CorporateGiftingSection() {
  return (
    <section className="bg-card border-y py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground">🏢 Cadouri Corporate VENTUZA</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Pachete personalizate cu logo-ul companiei tale pentru parteneri și angajați
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Link to="/corporate-gifting">
            <Button size="lg" className="font-semibold">Solicită Ofertă</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
