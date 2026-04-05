import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULTS = [
  {
    title: "Lumânări Artizanale Premium",
    badge_text: "🔥 OFERTA ZILEI",
    subtitle: "Descoperă colecția noastră de lumânări handmade din ceară de soia naturală",
    link_url: "/catalog",
    image_url: "",
    price: "49",
  },
];

export default function HeroSlider() {
  const { data: slides } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", "hero")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return data && data.length > 0 ? data : null;
    },
  });

  const items = slides || DEFAULTS;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIdx((i) => (i + 1) % items.length), [items.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, items.length]);

  const slide = items[idx] as any;

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex h-[260px] md:h-[480px]">
        {/* Left panel */}
        <div
          className="w-full md:w-[60%] flex flex-col justify-center px-6 md:px-12 relative"
          style={{ background: "linear-gradient(135deg, #001a66 0%, hsl(217 100% 50%) 100%)" }}
        >
          <span className="inline-block self-start bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full px-3 py-1 mb-3">
            {slide.badge_text || slide.title?.slice(0, 20) || "🔥 OFERTA ZILEI"}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">
            {slide.title}
          </h1>
          <p className="text-sm md:text-base text-white/80 mb-4 md:mb-6 max-w-md">
            {slide.subtitle || "Descoperă produsele noastre de calitate"}
          </p>
          {(slide as any).price && (
            <div className="mb-4">
              <span className="text-white/60 text-xs">De la</span>
              <span className="text-white text-2xl md:text-3xl font-black ml-2">{(slide as any).price} lei</span>
            </div>
          )}
          <div className="flex gap-3">
            <Link
              to={slide.link_url || "/catalog"}
              className="bg-destructive text-destructive-foreground text-sm font-bold px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Cumpără Acum →
            </Link>
            <Link
              to="/catalog"
              className="border border-white/40 text-white text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-white/10 transition-colors"
            >
              Află Mai Multe
            </Link>
          </div>
          <p className="text-[11px] text-white/50 mt-4">
            🚚 Livrare gratuită · ↩️ Retur 30 zile
          </p>

          {/* Dots */}
          {items.length > 1 && (
            <div className="flex gap-2 mt-4">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${i === idx ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="hidden md:flex w-[40%] items-center justify-center bg-white/5 relative"
          style={{ background: "linear-gradient(135deg, hsl(217 100% 50%) 0%, hsl(217 100% 60%) 100%)" }}
        >
          {slide.image_url ? (
            <img
              src={slide.image_url}
              alt={slide.title || "Hero"}
              className="max-h-[380px] object-contain drop-shadow-2xl"
            />
          ) : (
            <span className="text-[120px]">🕯</span>
          )}
        </div>
      </div>

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/35 transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/35 transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
