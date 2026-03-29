import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const moods = [
  { key: "relaxat", emoji: "🧘", label: "Relaxat", tags: ["relaxare", "lavanda", "calm", "spa"], gradient: "from-purple-500/20 to-indigo-500/20", border: "border-purple-300 dark:border-purple-700", active: "bg-purple-500 text-white" },
  { key: "romantic", emoji: "💕", label: "Romantic", tags: ["romantic", "trandafir", "florala"], gradient: "from-pink-500/20 to-rose-500/20", border: "border-pink-300 dark:border-pink-700", active: "bg-pink-500 text-white" },
  { key: "energic", emoji: "⚡", label: "Energic", tags: ["energie", "fresh", "citric"], gradient: "from-yellow-500/20 to-amber-500/20", border: "border-yellow-300 dark:border-yellow-700", active: "bg-yellow-500 text-white" },
  { key: "trist", emoji: "🌧️", label: "Comfort", tags: ["calda", "vanilie", "confort", "naturala"], gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-300 dark:border-blue-700", active: "bg-blue-500 text-white" },
  { key: "celebrare", emoji: "🎉", label: "Celebrare", tags: ["cadou", "premium", "set"], gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-300 dark:border-amber-700", active: "bg-amber-500 text-white" },
  { key: "meditatie", emoji: "🕯️", label: "Meditație", tags: ["meditatie", "santal", "lemn", "crackling"], gradient: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-300 dark:border-emerald-700", active: "bg-emerald-500 text-white" },
];

export default function CandleMoodSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (moodKey: string) => {
    if (selected === moodKey) {
      setSelected(null);
      setProducts([]);
      return;
    }
    setSelected(moodKey);
    setLoading(true);

    const mood = moods.find(m => m.key === moodKey);
    if (!mood) return;

    // Search products by mood tags
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("visible", true)
      .overlaps("tags", mood.tags)
      .limit(6);

    if (data && data.length > 0) {
      setProducts(data);
    } else {
      // Fallback: fetch featured products
      const { data: fallback } = await supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .eq("featured", true)
        .limit(6);
      setProducts(fallback || []);
    }
    setLoading(false);
  };

  return (
    <section className="container px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Cum te simți azi?</h2>
        <p className="text-sm text-muted-foreground">Alege starea ta și descoperă lumânarea perfectă</p>
      </div>

      {/* Mood pills */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
        {moods.map((mood) => (
          <button
            key={mood.key}
            onClick={() => handleSelect(mood.key)}
            className={`flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 text-sm font-semibold transition-all duration-300 active:scale-95 ${
              selected === mood.key
                ? `${mood.active} border-transparent shadow-lg scale-105`
                : `bg-card ${mood.border} text-foreground hover:shadow-md hover:scale-[1.02]`
            }`}
          >
            <span className="text-lg">{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {selected && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Căutăm lumânarea perfectă...</span>
            </div>
          ) : products.length > 0 ? (
            <>
              <p className="text-center text-sm text-muted-foreground mb-4">
                {moods.find(m => m.key === selected)?.emoji} Recomandate pentru starea <strong>{moods.find(m => m.key === selected)?.label}</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="text-center mt-4">
                <Link
                  to={`/catalog?mood=${selected}`}
                  className="inline-block text-sm font-medium text-primary hover:text-primary/80 underline transition-colors"
                >
                  Vezi toate produsele pentru {moods.find(m => m.key === selected)?.label} →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nu am găsit produse pentru această stare. Explorează <Link to="/catalog" className="text-primary underline">catalogul complet</Link>.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
