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
      <section className="relative overflow-hidden ventuza-gradient-dark">
        <div className="container py-12 md:py-32 lg:py-40 px-5">
          <div className="max-w-2xl">
            <p className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-primary mb-3 md:mb-6 font-semibold">
              Colecție artizanală VENTUZA
            </p>
            <h2 className="font-serif text-3xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-4 md:mb-6 text-foreground">
              Lumânări handmade pentru seri cu atmosferă
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-10 max-w-md leading-relaxed">
              Create manual în România din ceară naturală, cu arome fine și opțiuni de personalizare premium.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to="/catalog" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-8 md:px-10 text-xs tracking-[0.12em] uppercase font-semibold h-11 md:h-12">
                  Descoperă colecția
                </Button>
              </Link>
              <Link to="/personalizare" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10 rounded-md px-8 md:px-10 text-xs tracking-[0.12em] uppercase font-semibold h-11 md:h-12">
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
                className={`transition-all ${i === current ? "w-8 h-[2px] bg-primary shadow-[0_0_8px_hsl(185_100%_50%/0.5)]" : "w-4 h-[2px] bg-foreground/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
