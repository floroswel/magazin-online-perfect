import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function HeroSlider() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1000px] flex items-center justify-center overflow-hidden bg-ventuza-dark-surface noise-bg -mt-[72px] pt-[72px]">
      {/* Subtle warm radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(32,48%,46%,0.08)_0%,_transparent_70%)]" />

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Eyebrow */}
        <p
          className={`font-sans text-[11px] tracking-[4px] uppercase mb-6 transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ color: "hsl(var(--ventuza-amber))", transitionDelay: "0s" }}
        >
          COLECȚIA 2025
        </p>

        {/* Headline */}
        <h2
          className={`font-serif italic text-[#FAF6F0] leading-[1.1] mb-6 transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            transitionDelay: "0.2s",
          }}
        >
          Lumina care rămâne
        </h2>

        {/* Subheadline */}
        <p
          className={`font-sans font-light text-lg text-[#FAF6F0]/60 max-w-[480px] mx-auto mb-10 leading-relaxed transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "0.4s" }}
        >
          Lumânări artizanale din ingrediente naturale, parfumuri rare, create pentru momentele care contează
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "0.6s" }}
        >
          <Link
            to="/catalog"
            className="btn-cta bg-primary text-accent-foreground font-sans font-medium text-sm px-9 py-3.5 rounded-full hover:bg-ventuza-amber-dark transition-colors"
          >
            Descoperă colecția
          </Link>
          <Link
            to="/povestea-noastra"
            className="relative font-sans text-sm text-[#FAF6F0]/70 hover:text-[#FAF6F0] transition-colors group"
          >
            Povestea noastră
            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#FAF6F0]/50 group-hover:w-full transition-all duration-300" />
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <ChevronDown className="h-5 w-5 text-[#FAF6F0]/30 animate-scroll-arrow" />
      </div>
    </section>
  );
}
