import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  { id: "1", title: "Lumânări Artizanale Handmade", subtitle: "Fiecare lumânare e turnată manual cu dragoste și ingrediente naturale", cta: "DESCOPERĂ COLECȚIA", link: "/catalog", image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?auto=format&w=1200&q=80" },
  { id: "2", title: "Colecția de Sezon", subtitle: "Arome noi inspirate din natură — ediție limitată", cta: "VEZI NOUTĂȚILE", link: "/catalog?sort=newest", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&w=1200&q=80" },
  { id: "3", title: "Seturi Cadou Premium", subtitle: "Dăruiește aromă și căldură — pachete elegante pentru orice ocazie", cta: "ALEGE CADOUL", link: "/catalog?category=cadouri-seturi", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&w=1200&q=80" },
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
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-card">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 h-full flex items-center justify-center text-center">
              <div className="container px-4 md:px-8 max-w-3xl mx-auto">
                <div className="text-white">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl mb-2 md:mb-4 leading-tight drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg opacity-90 mb-4 md:mb-6 drop-shadow-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity min-h-[48px]"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow transition-colors" style={{ background: "rgba(200,134,10,0.8)", color: "#fff" }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow transition-colors" style={{ background: "rgba(200,134,10,0.8)", color: "#fff" }}>
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
