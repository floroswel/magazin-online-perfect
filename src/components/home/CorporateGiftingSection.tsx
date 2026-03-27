import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const features = [
  "Minim 10 bucăți",
  "Logo pe lumânare sau ambalaj",
  "Parfumuri personalizate",
  "Livrare în toată România",
  "Factură fiscală",
  "Termen: 7-14 zile",
];

export default function CorporateGiftingSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Corporate</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-3">Cadouri Corporate</h2>
          <p className="text-muted-foreground mb-10">
            Pachete elegante cu logo-ul companiei tale pentru parteneri, angajați și evenimente
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-10">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground/70">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Link to="/corporate-gifting">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-12 text-xs tracking-[0.15em] uppercase font-medium h-12">
              Solicită Ofertă
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
