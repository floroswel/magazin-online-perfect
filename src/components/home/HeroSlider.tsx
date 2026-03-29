import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    eyebrow: "COLECȚIA 2025",
    headline: "Lumânări artizanale\ncu suflet românesc",
    subtitle: "Create manual din ingrediente naturale, parfumuri rare și ceară de soia premium",
    cta1: { label: "Descoperă colecția", to: "/catalog" },
    cta2: { label: "Povestea noastră", to: "/povestea-noastra" },
    image: "https://images.unsplash.com/photo-1602607753498-2e513137e061?w=1600&h=900&fit=crop",
  },
  {
    eyebrow: "SETURI CADOU",
    headline: "Cadoul perfect\npentru cei dragi",
    subtitle: "Descoperă seturile noastre cadou cu ambalaj premium și livrare gratuită",
    cta1: { label: "Vezi seturile", to: "/catalog?category=seturi-cadou" },
    cta2: { label: "Personalizează", to: "/personalizare" },
    image: "https://images.unsplash.com/photo-1543248939-4296e1fea89b?w=1600&h=900&fit=crop",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] flex items-center overflow-hidden">
      {/* Background image */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      ))}

      <div className="relative z-10 container px-6">
        <div className="max-w-2xl">
          <p
            className={`font-sans text-xs tracking-[4px] uppercase mb-5 text-white/70 transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "0s" }}
          >
            {slide.eyebrow}
          </p>

          <h1
            className={`font-serif text-white leading-[1.1] mb-6 whitespace-pre-line transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ fontSize: "clamp(36px, 6vw, 72px)", transitionDelay: "0.2s" }}
          >
            {slide.headline}
          </h1>

          <p
            className={`font-sans font-light text-lg text-white/65 max-w-[480px] mb-10 leading-relaxed transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "0.4s" }}
          >
            {slide.subtitle}
          </p>

          <div
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "0.6s" }}
          >
            <Link
              to={slide.cta1.to}
              className="btn-cta bg-primary text-primary-foreground font-sans font-medium text-sm px-8 py-3.5 hover:opacity-90 transition-all"
            >
              {slide.cta1.label}
            </Link>
            <Link
              to={slide.cta2.to}
              className="font-sans text-sm text-white border border-white/40 px-8 py-3.5 hover:bg-white/10 transition-all"
            >
              {slide.cta2.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(p => (p - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent(p => (p + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-[3px] transition-all duration-300 ${i === current ? "w-8 bg-white" : "w-4 bg-white/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
