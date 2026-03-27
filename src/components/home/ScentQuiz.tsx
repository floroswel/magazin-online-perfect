import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  {
    q: "Ce stare vrei să creezi?",
    options: [
      { emoji: "😌", label: "Relaxare", tags: ["relaxare", "lavandă", "vanilie"] },
      { emoji: "⚡", label: "Energie", tags: ["energie", "citrice", "mentă"] },
      { emoji: "🥰", label: "Romantism", tags: ["romantic", "trandafir", "iasomie"] },
      { emoji: "🏡", label: "Confort acasă", tags: ["confort", "scorțișoară", "biscuit"] },
    ],
  },
  {
    q: "Ce parfumuri preferi?",
    options: [
      { emoji: "🌸", label: "Florale", tags: ["floral", "trandafir", "iasomie", "lavandă"] },
      { emoji: "🌿", label: "Fresh/Verzi", tags: ["fresh", "mentă", "eucalipt", "ceai verde"] },
      { emoji: "🍂", label: "Calde/Dulci", tags: ["dulce", "vanilie", "caramel", "scorțișoară"] },
      { emoji: "🪵", label: "Lemnoase", tags: ["lemnos", "cedru", "santal", "mosc"] },
    ],
  },
  {
    q: "Unde vei folosi lumânarea?",
    options: [
      { emoji: "🛁", label: "Baie", tags: ["relaxare", "spa", "lavandă"] },
      { emoji: "🛏️", label: "Dormitor", tags: ["romantic", "vanilie", "liniștitor"] },
      { emoji: "🛋️", label: "Living", tags: ["confort", "cald", "atmosferic"] },
      { emoji: "🏢", label: "Birou", tags: ["energie", "concentrare", "fresh"] },
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
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  useEffect(() => {
    if (answers.length === questions.length) {
      setLoading(true);
      // Collect all selected tags
      const allTags = answers.flatMap((ai, qi) => questions[qi].options[ai].tags);
      // Search for products matching tags
      supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .limit(3)
        .then(({ data }) => {
          setRecommendations(data || []);
          setLoading(false);
          // Save quiz result
          supabase.from("scent_quiz_results" as any).insert({
            session_id: crypto.randomUUID(),
            answers: answers.map((ai, qi) => ({ question: questions[qi].q, answer: questions[qi].options[ai].label })),
            recommended_products: (data || []).map(p => p.id),
          }).then(() => {});
        });
    }
  }, [answers]);

  const reset = () => { setStep(0); setAnswers([]); setRecommendations([]); };

  if (answers.length === questions.length) {
    return (
      <section className="container py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">🌸 Perfect pentru tine!</h2>
          <p className="text-muted-foreground mt-1">Pe baza preferințelor tale, iată recomandările noastre:</p>
        </div>
        {loading ? (
          <p className="text-center text-muted-foreground">Se încarcă recomandările...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="text-center">
          <Button variant="outline" onClick={reset}>Reia quiz-ul</Button>
        </div>
      </section>
    );
  }

  const current = questions[step];

  return (
    <section className="container py-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">🌸 Găsește Parfumul Tău Perfect</h2>
        <p className="text-muted-foreground mt-1">Răspunde la 3 întrebări și îți recomandăm lumânarea ideală</p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <h3 className="text-lg font-semibold text-foreground text-center mb-4">{current.q}</h3>
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
              onClick={() => handleAnswer(i)}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
