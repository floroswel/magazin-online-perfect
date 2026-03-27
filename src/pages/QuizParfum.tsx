import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  { q: "Ce stare de spirit dorești?", options: ["😌 Relaxare", "⚡ Energie", "🥰 Romantism", "🏡 Confort", "🎉 Sărbătoare"] },
  { q: "Ce parfumuri preferi în general?", options: ["🌸 Florale", "🌿 Ierboase/Fresh", "🍂 Calde/Condimentate", "🍬 Dulci/Gourmand", "🪵 Lemnoase/Pământoase"] },
  { q: "Care e sezonul tău preferat?", options: ["🌷 Primăvara", "☀️ Vara", "🍁 Toamna", "❄️ Iarna"] },
  { q: "Unde vei folosi cel mai des lumânarea?", options: ["🛁 Baie/Spa", "🛏️ Dormitor", "🛋️ Living", "🏢 Birou/Workspace", "🍽️ Sufragerie/Masă"] },
  { q: "Ce intensitate preferi?", options: ["🌬️ Delicată", "🌊 Medie", "🔥 Puternică"] },
];

export default function QuizParfum() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      setLoading(true);
      supabase.from("products").select("*").eq("visible", true).limit(3)
        .then(({ data }) => {
          setRecommendations(data || []);
          setLoading(false);
        });
    }
  };

  const reset = () => { setStep(0); setAnswers([]); setDone(false); setRecommendations([]); };

  if (done) {
    return (
      <Layout>
        <div className="container py-10 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">🌸 Parfumul tău ideal!</h1>
            <p className="text-muted-foreground mt-2">Pe baza răspunsurilor tale, iată recomandările noastre perfecte:</p>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground">Se calculează...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div className="text-center">
            <Button variant="outline" onClick={reset}>Reia quiz-ul</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const current = questions[step];

  return (
    <Layout>
      <div className="container py-10 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">🌸 Găsește Parfumul Tău Perfect</h1>
          <p className="text-muted-foreground mt-1">5 întrebări simple, recomandări personalizate</p>
        </div>

        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground text-center mb-6">
          {step + 1}. {current.q}
        </h2>

        <div className="space-y-3">
          {current.options.map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className="w-full h-auto py-4 justify-start text-left hover:border-primary hover:bg-primary/5"
              onClick={() => handleAnswer(opt)}
            >
              <span className="text-base">{opt}</span>
            </Button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
