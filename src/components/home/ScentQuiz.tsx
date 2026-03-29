import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CloudMoon, Zap, Heart, Coffee, Flower2, Wind, Candy, TreePine, Bath, BedDouble, Sofa, Laptop } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const questions = [
  {
    q: "Ce atmosferă dorești?",
    options: [
      { label: "Relaxare", tags: ["relaxare", "lavanda", "vegan"], icon: CloudMoon, color: "bg-purple-100 text-purple-600" },
      { label: "Energie", tags: ["energie", "fresh"], icon: Zap, color: "bg-yellow-100 text-yellow-600" },
      { label: "Romantism", tags: ["romantic", "florala", "trandafir"], icon: Heart, color: "bg-pink-100 text-pink-600" },
      { label: "Confort", tags: ["calda", "cadou", "naturala"], icon: Coffee, color: "bg-orange-100 text-orange-600" },
    ],
  },
  {
    q: "Ce note de parfum preferi?",
    options: [
      { label: "Florale", tags: ["florala", "trandafir", "romantic"], icon: Flower2, color: "bg-pink-100 text-pink-600" },
      { label: "Fresh", tags: ["lavanda", "vegan", "relaxare"], icon: Wind, color: "bg-teal-100 text-teal-600" },
      { label: "Calde & Dulci", tags: ["parfumata", "naturala", "cadou"], icon: Candy, color: "bg-amber-100 text-amber-600" },
      { label: "Lemnoase", tags: ["crackling", "fitil-lemn", "santal"], icon: TreePine, color: "bg-emerald-100 text-emerald-600" },
    ],
  },
  {
    q: "Unde vei aprinde lumânarea?",
    options: [
      { label: "Baie & Spa", tags: ["relaxare", "lavanda", "aromatherapy"], icon: Bath, color: "bg-blue-100 text-blue-600" },
      { label: "Dormitor", tags: ["romantic", "florala", "vegan"], icon: BedDouble, color: "bg-indigo-100 text-indigo-600" },
      { label: "Living", tags: ["parfumata", "handmade", "naturala"], icon: Sofa, color: "bg-orange-100 text-orange-600" },
      { label: "Birou", tags: ["energie", "fresh", "moderna"], icon: Laptop, color: "bg-slate-100 text-slate-600" },
    ],
  },
];

export default function ScentQuiz() {
  const [step, setStep] = useState(0);
  const [collectedTags, setCollectedTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (tags: string[]) => {
    const newTags = [...collectedTags, ...tags];
    setCollectedTags(newTags);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      const { data: products } = await supabase.from("products").select("*").eq("visible", true);
      if (products && products.length > 0) {
        const scored = products.map((p) => {
          const productTags = (p.tags as string[]) || [];
          const score = newTags.reduce((acc, t) => acc + (productTags.includes(t) ? 1 : 0), 0);
          return { ...p, _score: score };
        });
        scored.sort((a, b) => b._score - a._score);
        setRecommendations(scored.slice(0, 3));
      }
      setLoading(false);
    }
  };

  const reset = () => { setStep(0); setCollectedTags([]); setRecommendations([]); };

  if (collectedTags.length >= questions.reduce((s, q) => s + q.options[0].tags.length, 0) || recommendations.length > 0) {
    if (recommendations.length > 0) {
      return (
        <section className="container py-12 md:py-20 px-4">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent mb-2 md:mb-3 font-medium">Recomandări</p>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-foreground">Parfumul Tău Perfect</h2>
            <p className="text-muted-foreground mt-2 text-sm">Pe baza preferințelor tale, iată selecția noastră:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center space-x-3">
            <Button variant="outline" onClick={reset} className="rounded-lg text-xs tracking-wide uppercase px-8">Reia Quiz-ul</Button>
            <Link to="/quiz-parfum"><Button className="rounded-lg text-xs tracking-wide uppercase px-8">Quiz complet (5 întrebări)</Button></Link>
          </div>
        </section>
      );
    }
  }

  const current = questions[step];

  return (
    <section className="bg-card py-12 md:py-20">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent mb-2 md:mb-3 font-medium">Quiz Parfum</p>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-foreground">Găsește Parfumul Tău</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2">3 întrebări · Recomandări personalizate</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-8">
            {questions.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>

          <h3 className="font-serif text-xl font-normal text-foreground text-center mb-6">{current.q}</h3>
          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="py-6 px-4 bg-background border border-border rounded-xl hover:border-accent hover:shadow-md text-center transition-all duration-200 group flex flex-col items-center gap-3"
                onClick={() => handleAnswer(opt.tags)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${opt.color} transition-transform group-hover:scale-110`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
