import { Leaf, HandMetal, Palette, Truck } from "lucide-react";

const reasons = [
  {
    icon: Leaf,
    title: "Ceară 100% Naturală",
    desc: "Folosim exclusiv ceară de soia premium, fără parafină sau aditivi chimici. Arde curat, fără fum negru.",
  },
  {
    icon: HandMetal,
    title: "Handmade în România",
    desc: "Fiecare lumânare este turnată manual, cu atenție la detalii, în atelierul nostru din România.",
  },
  {
    icon: Palette,
    title: "Personalizare Completă",
    desc: "Alege aroma, culoarea, mesajul și ambalajul. Creăm lumânări unice pentru tine sau ca și cadou.",
  },
  {
    icon: Truck,
    title: "Livrare Rapidă & Gratuită",
    desc: "Comenzile peste 200 RON beneficiază de livrare gratuită. Ambalaj premium inclus.",
  },
];

export default function WhyVentuza() {
  return (
    <section className="py-12 md:py-20">
      <div className="container px-4">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3 block">
            De ce VENTUZA
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-foreground">
            Mai mult decât o lumânare
          </h2>
          <div className="w-16 h-1 bg-primary rounded mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="group bg-card rounded-xl border border-border p-6 md:p-8 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-sm md:text-base mb-2">
                {r.title}
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
