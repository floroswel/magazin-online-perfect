import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import heroImage from "@/assets/hero-candles.jpg";

export default function HeroSlider() {
  const [banners, setBanners] = useState<Tables<"banners">[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .eq("placement", "homepage")
      .order("sort_order")
      .then(({ data }) => setBanners(data || []));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative overflow-hidden">
        {/* Background image */}
        <img
          src={heroImage}
          alt="Lumânări artizanale VENTUZA"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={800}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="container relative py-16 md:py-32 lg:py-40 px-5">
          <div className="max-w-xl">
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full mb-5 shadow-lg">
              🔥 NOU ÎN MAGAZIN
            </span>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5 md:mb-7 text-white drop-shadow-lg">
              Lumânări artizanale din ceară naturală
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-7 md:mb-9 max-w-lg leading-relaxed font-medium drop-shadow">
              Handmade în România. Arome premium, personalizare completă și livrare rapidă.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/catalog" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-extrabold rounded-lg px-10 md:px-14 text-sm h-13 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
                  Cumpără acum
                </Button>
              </Link>
              <Link to="/personalizare" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-white/95 text-primary font-bold rounded-lg px-8 md:px-12 text-sm h-13 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Personalizează
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {b.link_url ? (
              <Link to={b.link_url} className="block h-full">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} width={1920} height={600} />
                ) : (
                  <div className="w-full h-full ventuza-gradient-dark flex items-center justify-center">
                    <h2 className="text-secondary-foreground font-serif text-3xl md:text-5xl font-medium text-center px-4">{b.title}</h2>
                  </div>
                )}
              </Link>
            ) : b.image_url ? (
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" width={1920} height={600} />
            ) : (
              <div className="w-full h-full ventuza-gradient-dark flex items-center justify-center">
                <h2 className="text-secondary-foreground font-serif text-3xl md:text-5xl font-medium text-center px-4">{b.title}</h2>
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground/60 hover:text-secondary-foreground border border-secondary-foreground/20 rounded-none h-10 w-10"
            onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-foreground/60 hover:text-secondary-foreground border border-secondary-foreground/20 rounded-none h-10 w-10"
            onClick={() => setCurrent(c => (c + 1) % banners.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all ${i === current ? "w-8 h-[2px] bg-primary" : "w-4 h-[2px] bg-foreground/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
