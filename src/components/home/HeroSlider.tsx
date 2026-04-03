import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "1",
    title: "TIMELESS STYLE FOR MODERN LIVES",
    subtitle: "",
    cta: "SHOP ALL PRODUCTS",
    link: "/catalog",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&w=1600&q=80",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "hero_slides")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json) && (data.value_json as any[]).length > 0) {
          setSlides(data.value_json as unknown as HeroSlide[]);
        }
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[85vh] min-h-[500px] max-h-[900px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* Subtle overlay for text readability */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Content — bottom-left large uppercase text */}
            <div className="relative z-10 h-full flex items-end">
              <div className="px-6 md:px-12 lg:px-16 pb-12 md:pb-16 lg:pb-20 max-w-4xl">
                <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.95] tracking-tight mb-6 md:mb-8"
                    style={{ fontStyle: 'italic' }}>
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="text-white/80 text-sm md:text-base mb-6 max-w-md">
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  to={slide.link}
                  className="inline-flex items-center justify-center bg-white text-foreground font-medium text-sm px-8 py-3.5 hover:bg-foreground hover:text-white transition-colors uppercase tracking-widest"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Minimal dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 right-6 md:right-12 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
