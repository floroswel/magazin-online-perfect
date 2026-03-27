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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-[hsl(220,80%,35%)]">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container relative py-12 md:py-24 lg:py-32 px-5">
          <div className="max-w-2xl">
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-md">
              🔥 NOU ÎN MAGAZIN
            </span>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6 text-white drop-shadow-sm">
              Lumânări artizanale din ceară naturală
            </h2>
            <p className="text-sm md:text-lg text-white/85 mb-6 md:mb-8 max-w-lg leading-relaxed">
              Handmade în România. Arome premium, personalizare completă și livrare rapidă.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/catalog" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-extrabold rounded-lg px-8 md:px-12 text-sm h-12 shadow-lg hover:shadow-xl transition-all">
                  Cumpără acum
                </Button>
              </Link>
              <Link to="/personalizare" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-white/90 text-primary font-bold rounded-lg px-8 md:px-10 text-sm h-12 shadow-md">
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
