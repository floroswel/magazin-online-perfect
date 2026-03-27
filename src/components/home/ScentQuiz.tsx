import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CloudMoon, Zap, Heart, Coffee, Flower2, Wind, Candy, TreePine, Bath, BedDouble, Sofa, Laptop } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  {
    q: "Ce atmosferă dorești?",
    options: [
      { label: "Relaxare", tags: ["relaxare", "lavandă", "vanilie"], icon: CloudMoon, color: "bg-purple-100 text-purple-600" },
      { label: "Energie", tags: ["energie", "citrice", "mentă"], icon: Zap, color: "bg-yellow-100 text-yellow-600" },
      { label: "Romantism", tags: ["romantic", "trandafir", "iasomie"], icon: Heart, color: "bg-pink-100 text-pink-600" },
      { label: "Confort", tags: ["confort", "scorțișoară", "biscuit"], icon: Coffee, color: "bg-orange-100 text-orange-600" },
    ],
  },
  {
    q: "Ce note de parfum preferi?",
    options: [
      { label: "Florale", tags: ["floral", "trandafir", "iasomie", "lavandă"], icon: Flower2, color: "bg-pink-100 text-pink-600" },
      { label: "Fresh", tags: ["fresh", "mentă", "eucalipt"], icon: Wind, color: "bg-teal-100 text-teal-600" },
      { label: "Calde & Dulci", tags: ["dulce", "vanilie", "caramel"], icon: Candy, color: "bg-amber-100 text-amber-600" },
      { label: "Lemnoase", tags: ["lemnos", "cedru", "santal"], icon: TreePine, color: "bg-emerald-100 text-emerald-600" },
    ],
  },
  {
    q: "Unde vei aprinde lumânarea?",
    options: [
      { label: "Baie & Spa", tags: ["relaxare", "spa", "lavandă"], icon: Bath, color: "bg-blue-100 text-blue-600" },
      { label: "Dormitor", tags: ["romantic", "vanilie"], icon: BedDouble, color: "bg-indigo-100 text-indigo-600" },
      { label: "Living", tags: ["confort", "cald"], icon: Sofa, color: "bg-orange-100 text-orange-600" },
      { label: "Birou", tags: ["energie", "concentrare"], icon: Laptop, color: "bg-slate-100 text-slate-600" },
    ],
  },
];

export default function ScentQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [recommendations, setRecommendations] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (step < questions.length - 1) setStep(step + 1);
  };

  useEffect(() => {
    if (answers.length === questions.length) {
      setLoading(true);
      supabase.from("products").select("*").eq("visible", true).limit(3)
        .then(({ data }) => { setRecommendations(data || []); setLoading(false); });
    }
  }, [answers]);

  const reset = () => { setStep(0); setAnswers([]); setRecommendations([]); };

  if (answers.length === questions.length) {
    return (
      <section className="container py-12 md:py-20 px-4">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-primary mb-2 md:mb-3 font-medium">Recomandări</p>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-foreground">Parfumul Tău Perfect</h2>
          <p className="text-muted-foreground mt-2">Pe baza preferințelor tale, iată selecția noastră:</p>
        </div>
        {loading ? (
          <p className="text-center text-muted-foreground">Se încarcă...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="text-center">
          <Button variant="outline" onClick={reset} className="rounded-lg text-xs tracking-wide uppercase px-8">Reia Quiz-ul</Button>
        </div>
      </section>
    );
  }

  const current = questions[step];

  return (
    <section className="bg-card py-12 md:py-20">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-primary mb-2 md:mb-3 font-medium">Quiz Parfum</p>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-foreground">Găsește Parfumul Tău</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2">3 întrebări · Recomandări personalizate</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-8">
            {questions.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>

          <h3 className="font-serif text-xl font-bold text-foreground text-center mb-6">{current.q}</h3>
          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="py-6 px-4 bg-background border border-border rounded-xl hover:border-primary hover:shadow-md text-center transition-all duration-200 group flex flex-col items-center gap-3"
                onClick={() => handleAnswer(i)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${opt.color} transition-transform group-hover:scale-110`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
