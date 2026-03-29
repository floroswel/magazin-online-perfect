import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  {
    q: "Ce stare de spirit dorești?",
    options: [
      { label: "😌 Relaxare", tags: ["relaxare", "lavanda", "vegan"] },
      { label: "⚡ Energie", tags: ["energie", "citrice", "fresh"] },
      { label: "🥰 Romantism", tags: ["romantic", "florala", "trandafir"] },
      { label: "🏡 Confort", tags: ["calda", "cadou", "naturala"] },
      { label: "🎉 Sărbătoare", tags: ["craciun", "iarna", "premium"] },
    ],
  },
  {
    q: "Ce parfumuri preferi în general?",
    options: [
      { label: "🌸 Florale", tags: ["florala", "trandafir", "romantic"] },
      { label: "🌿 Ierboase/Fresh", tags: ["lavanda", "vegan", "relaxare"] },
      { label: "🍂 Calde/Condimentate", tags: ["calda", "craciun", "iarna"] },
      { label: "🍬 Dulci/Gourmand", tags: ["parfumata", "naturala", "cadou"] },
      { label: "🪵 Lemnoase/Pământoase", tags: ["crackling", "fitil-lemn", "santal"] },
    ],
  },
  {
    q: "Care e sezonul tău preferat?",
    options: [
      { label: "🌷 Primăvara", tags: ["florala", "trandafir"] },
      { label: "☀️ Vara", tags: ["fresh", "vegan", "relaxare"] },
      { label: "🍁 Toamna", tags: ["calda", "parfumata", "naturala"] },
      { label: "❄️ Iarna", tags: ["craciun", "iarna", "cadou"] },
    ],
  },
  {
    q: "Unde vei folosi cel mai des lumânarea?",
    options: [
      { label: "🛁 Baie/Spa", tags: ["relaxare", "lavanda", "aromatherapy"] },
      { label: "🛏️ Dormitor", tags: ["romantic", "florala", "vegan"] },
      { label: "🛋️ Living", tags: ["parfumata", "handmade", "naturala"] },
      { label: "🏢 Birou/Workspace", tags: ["energie", "fresh"] },
      { label: "🍽️ Sufragerie/Masă", tags: ["decorativa", "design", "moderna"] },
    ],
  },
  {
    q: "Ce intensitate preferi?",
    options: [
      { label: "🌬️ Delicată", tags: ["decorativa", "flotante", "design"] },
      { label: "🌊 Medie", tags: ["parfumata", "handmade", "soia"] },
      { label: "🔥 Puternică", tags: ["crackling", "fitil-lemn", "premium"] },
    ],
  },
];

export default function QuizParfum() {
  const [step, setStep] = useState(0);
  const [collectedTags, setCollectedTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAnswer = async (tags: string[]) => {
    const newTags = [...collectedTags, ...tags];
    setCollectedTags(newTags);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      setLoading(true);

      // Score products by tag overlap
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("visible", true);

      if (products && products.length > 0) {
        const scored = products.map((p) => {
          const productTags = (p.tags as string[]) || [];
          const score = newTags.reduce(
            (acc, t) => acc + (productTags.includes(t) ? 1 : 0),
            0
          );
          return { ...p, _score: score };
        });
        scored.sort((a, b) => b._score - a._score);
        setRecommendations(scored.slice(0, 3));
      }
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setCollectedTags([]);
    setDone(false);
    setRecommendations([]);
  };

  if (done) {
    return (
      <Layout>
        <div className="container py-10 max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-medium mb-2">Recomandări personalizate</p>
            <h1 className="font-serif text-3xl font-light text-foreground">Parfumul tău ideal</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Pe baza celor {questions.length} răspunsuri, iată lumânările perfecte pentru tine:
            </p>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground">Se calculează recomandările...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <div className="text-center space-x-3">
            <Button variant="outline" onClick={reset}>Reia quiz-ul</Button>
            <Link to="/catalog"><Button>Vezi tot catalogul</Button></Link>
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
          <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-medium mb-2">Quiz Parfum</p>
          <h1 className="font-serif text-2xl font-light text-foreground">Găsește Parfumul Tău Perfect</h1>
          <p className="text-muted-foreground mt-1 text-sm">5 întrebări simple, recomandări personalizate</p>
        </div>

        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-accent" : "bg-muted"}`}
            />
          ))}
        </div>

        <h2 className="font-serif text-lg font-normal text-foreground text-center mb-6">
          {step + 1}. {current.q}
        </h2>

        <div className="space-y-3">
          {current.options.map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className="w-full h-auto py-4 justify-start text-left hover:border-accent hover:bg-accent/5"
              onClick={() => handleAnswer(opt.tags)}
            >
              <span className="text-base">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
