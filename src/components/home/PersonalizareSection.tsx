import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  { number: "01", title: "Alege produsul", desc: "Lumânare, set sau recipient" },
  { number: "02", title: "Parfumul tău", desc: "Din peste 30 de arome" },
  { number: "03", title: "Culoare dorită", desc: "Paleta completă disponibilă" },
  { number: "04", title: "Mesaj personal", desc: "Text gravat sau tipărit" },
];

const previews = [
  { title: "Lumânare Botez", desc: "Ceară albă · Text personalizat cu nume și dată", occasion: "Botez" },
  { title: "Set Cadou Romantic", desc: "3 lumânări · Parfum trandafir · Cutie premium", occasion: "Cadou" },
  { title: "Lumânare Nuntă", desc: "Ceară crem · Inițialele mirilor · Ambalaj lux", occasion: "Nuntă" },
];

export default function PersonalizareSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Atelier de Personalizare</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">Creează Lumânarea Ta Perfectă</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Alege parfumul, culoarea și mesajul — realizăm manual, special pentru tine
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center group">
              <span className="font-serif text-3xl font-light text-primary/40 group-hover:text-primary transition-colors block mb-2">{s.number}</span>
              <h3 className="font-serif text-base font-medium text-foreground mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {previews.map((p, i) => (
            <div key={i} className="group p-8 border border-border hover:border-primary transition-all duration-300 bg-card">
              <span className="text-[10px] tracking-[0.2em] uppercase text-primary font-medium">{p.occasion}</span>
              <h3 className="font-serif text-lg font-medium text-foreground mt-2 mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
              <Link to="/personalizare" className="text-xs tracking-wide uppercase text-primary hover:text-primary/80 font-medium transition-colors">
                Personalizează similar →
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/personalizare">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-12 text-xs tracking-[0.15em] uppercase font-medium h-12">
              Începe Personalizarea
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4 tracking-wide">
            Preparare manuală în 3-5 zile lucrătoare · Satisfacție garantată
          </p>
        </div>
      </div>
    </section>
  );
}
