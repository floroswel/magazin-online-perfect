import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
        <div className="container relative z-10 py-20 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-6 font-medium">Artă · Parfum · Lumină</p>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium leading-[1.1] mb-6">
              Lumânări<br />
              <span className="italic text-ventuza-gold">handmade</span><br />
              din ceară naturală
            </h2>
            <p className="text-base md:text-lg text-secondary-foreground/60 mb-10 max-w-md leading-relaxed">
              Create manual cu dragoste în România. Arome naturale, design unic și posibilitate de personalizare completă.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/catalog">
                <Button size="lg" className="bg-ventuza-gold hover:bg-ventuza-gold-light text-secondary rounded-none px-10 text-xs tracking-[0.15em] uppercase font-medium h-12">
                  Descoperă Colecția
                </Button>
              </Link>
              <Link to="/personalizare">
                <Button size="lg" variant="outline" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/5 rounded-none px-10 text-xs tracking-[0.15em] uppercase font-medium h-12">
                  Personalizează
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <div className="w-full h-full" style={{ background: "radial-gradient(ellipse at center, hsl(36 60% 42% / 0.4), transparent)" }} />
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
                className={`transition-all ${i === current ? "w-8 h-[2px] bg-ventuza-gold" : "w-4 h-[2px] bg-secondary-foreground/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
