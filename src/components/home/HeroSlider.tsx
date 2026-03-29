import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HeroSlider() {
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1602607753498-2e513137e061?w=1920&h=1080&fit=crop",
      title: "STIL ATEMPORAL\nPENTRU VIAȚA\nMODERNĂ",
      cta: "CUMPĂRĂ ACUM",
      link: "/catalog",
    },
    {
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&h=1080&fit=crop",
      title: "DESCOPERĂ\nCOLECȚIA\nNOUĂ",
      cta: "VEZI COLECȚIA",
      link: "/catalog?category=noi",
    },
  ];

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1000px] flex items-end overflow-hidden">
      {/* Background images */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={s.image}
            alt="Mama Lucica"
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container px-6 md:px-8 pb-16 md:pb-24">
        <h1
          className={`font-serif text-white uppercase leading-[0.92] mb-8 transition-all duration-1000 whitespace-pre-line ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ fontSize: "clamp(36px, 7vw, 82px)", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {slide.title}
        </h1>

        <Link
          to={slide.link}
          className={`inline-block font-sans text-[12px] font-medium tracking-[2.5px] uppercase text-foreground bg-background px-10 py-4 hover:bg-foreground hover:text-background transition-all duration-300 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "0.3s" }}
        >
          {slide.cta}
        </Link>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="flex gap-2 mt-8">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-[2px] transition-all duration-500 ${
                  i === current ? "w-10 bg-white" : "w-5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
