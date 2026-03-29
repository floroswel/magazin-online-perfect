import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Lumânări Artizanale Handmade",
    subtitle: "Fiecare lumânare e turnată manual cu dragoste și ingrediente naturale",
    cta: "DESCOPERĂ COLECȚIA",
    link: "/catalog",
    image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=1200&h=500&fit=crop",
    bg: "from-primary/90 to-primary/60",
  },
  {
    title: "Colecția de Sezon",
    subtitle: "Arome noi inspirate din natură — ediție limitată",
    cta: "VEZI NOUTĂȚILE",
    link: "/catalog?sort=newest",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&h=500&fit=crop",
    bg: "from-foreground/80 to-foreground/50",
  },
  {
    title: "Seturi Cadou Premium",
    subtitle: "Dăruiește aromă și căldură — pachete elegante pentru orice ocazie",
    cta: "ALEGE CADOUL",
    link: "/catalog?category=cadouri-seturi",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&h=500&fit=crop",
    bg: "from-accent/90 to-accent/60",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <section className="relative w-full overflow-hidden bg-card">
      <div className="relative h-[240px] sm:h-[340px] md:h-[440px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40" />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg}`} />
            <div className="relative z-10 h-full flex items-center justify-center text-center">
              <div className="container px-4 md:px-8 max-w-3xl mx-auto">
                <div className="text-primary-foreground">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-2 md:mb-4 leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg opacity-90 mb-4 md:mb-6 drop-shadow-md">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-block bg-primary-foreground text-foreground font-bold text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-opacity min-h-[48px] flex items-center justify-center"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-card/80 rounded-full flex items-center justify-center shadow hover:bg-card transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-card/80 rounded-full flex items-center justify-center shadow hover:bg-card transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary-foreground w-6" : "bg-primary-foreground/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
