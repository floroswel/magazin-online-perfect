import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { icon: "🕯️", title: "Alege produsul", desc: "PASUL 1" },
  { icon: "🌸", title: "Parfum preferat", desc: "PASUL 2" },
  { icon: "🎨", title: "Culoare dorită", desc: "PASUL 3" },
  { icon: "✍️", title: "Text personal", desc: "PASUL 4" },
];

const previews = [
  { title: "Lumânare Botez Personalizată", text: 'Albă + Text "Bine ai venit, Sofia! 12.03.2025"', cta: "Personalizează similar" },
  { title: "Set Cadou Romantic", text: "Roz + Parfum Trandafir + Cutie cadou lux", cta: "Creează setul tău" },
  { title: "Lumânare Nuntă", text: 'Crem + Text "Elena & Mihai ❤️ 15.06.2025"', cta: "Comandă pentru evenimentul tău" },
];

export default function PersonalizareSection() {
  return (
    <section className="bg-primary/5 border-y border-primary/10 py-12">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">✨ Creează Lumânarea Ta Perfectă</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Alege parfumul, culoarea și mesajul — realizăm manual pentru tine
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-2">
                {s.icon}
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{s.desc}</p>
              <p className="text-sm font-medium text-foreground mt-1">{s.title}</p>
              {i < steps.length - 1 && (
                <span className="hidden md:inline-block text-muted-foreground text-lg absolute translate-x-full">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {previews.map((p, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.text}</p>
                <Link to="/personalizare">
                  <Button variant="outline" size="sm" className="w-full">{p.cta}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/personalizare">
            <Button size="lg" className="font-semibold text-base">🎨 Începe Personalizarea</Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Fiecare lumânare este realizată manual în 3-5 zile lucrătoare · Satisfacție garantată ✓
          </p>
        </div>
      </div>
    </section>
  );
}
