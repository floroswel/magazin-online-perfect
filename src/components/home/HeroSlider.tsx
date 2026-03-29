import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HeroSlider() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1000px] flex items-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1602607753498-2e513137e061?w=1920&h=1080&fit=crop"
          alt="Mama Lucica"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 container px-6 pb-20 md:pb-28">
        <h1
          className={`font-serif text-white uppercase leading-[0.95] mb-8 transition-all duration-1000 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Stil Atemporal pentru<br />
          <span className="italic font-normal">Viața Modernă</span>
        </h1>

        <Link
          to="/catalog"
          className={`inline-block font-sans text-[12px] font-medium tracking-[2px] uppercase text-foreground bg-background px-10 py-4 hover:bg-foreground hover:text-background transition-all duration-300 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "0.3s" }}
        >
          CUMPĂRĂ ACUM
        </Link>
      </div>
    </section>
  );
}
