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
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    // Fallback hero
    return (
      <section className="emag-gradient text-white">
        <div className="container py-10 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Cele mai bune oferte sunt aici! 🔥</h1>
            <p className="text-lg text-white/80 mb-6">Descoperă mii de produse la prețuri imbatabile. Livrare rapidă în toată România.</p>
            <Link to="/catalog">
              <Button size="lg" className="font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground">
                Vezi toate produsele
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section className="relative overflow-hidden bg-muted">
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] lg:h-[460px]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {b.link_url ? (
              <Link to={b.link_url} className="block h-full">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full emag-gradient flex items-center justify-center">
                    <h2 className="text-white text-2xl md:text-4xl font-bold text-center px-4">{b.title}</h2>
                  </div>
                )}
              </Link>
            ) : b.image_url ? (
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full emag-gradient flex items-center justify-center">
                <h2 className="text-white text-2xl md:text-4xl font-bold text-center px-4">{b.title}</h2>
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
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm rounded-full h-10 w-10"
            onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm rounded-full h-10 w-10"
            onClick={() => setCurrent(c => (c + 1) % banners.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary w-6" : "bg-background/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
