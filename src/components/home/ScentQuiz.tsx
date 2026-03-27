import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  {
    q: "Ce atmosferă dorești?",
    options: [
      { label: "Relaxare", tags: ["relaxare", "lavandă", "vanilie"] },
      { label: "Energie", tags: ["energie", "citrice", "mentă"] },
      { label: "Romantism", tags: ["romantic", "trandafir", "iasomie"] },
      { label: "Confort", tags: ["confort", "scorțișoară", "biscuit"] },
    ],
  },
  {
    q: "Ce note de parfum preferi?",
    options: [
      { label: "Florale", tags: ["floral", "trandafir", "iasomie", "lavandă"] },
      { label: "Fresh", tags: ["fresh", "mentă", "eucalipt"] },
      { label: "Calde & Dulci", tags: ["dulce", "vanilie", "caramel"] },
      { label: "Lemnoase", tags: ["lemnos", "cedru", "santal"] },
    ],
  },
  {
    q: "Unde vei aprinde lumânarea?",
    options: [
      { label: "Baie & Spa", tags: ["relaxare", "spa", "lavandă"] },
      { label: "Dormitor", tags: ["romantic", "vanilie"] },
      { label: "Living", tags: ["confort", "cald"] },
      { label: "Birou", tags: ["energie", "concentrare"] },
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
      <section className="container py-20">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Recomandări</p>
          <h2 className="font-serif text-3xl font-medium text-foreground">Parfumul Tău Perfect</h2>
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
          <Button variant="outline" onClick={reset} className="rounded-none text-xs tracking-wide uppercase px-8">Reia Quiz-ul</Button>
        </div>
      </section>
    );
  }

  const current = questions[step];

  return (
    <section className="container py-20">
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Quiz Parfum</p>
        <h2 className="font-serif text-3xl font-medium text-foreground">Găsește Parfumul Tău</h2>
        <p className="text-muted-foreground mt-2">3 întrebări · Recomandări personalizate</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex gap-2 mb-8">
          {questions.map((_, i) => (
            <div key={i} className={`h-[2px] flex-1 transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <h3 className="font-serif text-xl font-medium text-foreground text-center mb-6">{current.q}</h3>
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => (
            <button
              key={i}
              className="py-5 px-4 border border-border hover:border-primary text-center transition-all duration-200 group"
              onClick={() => handleAnswer(i)}
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
