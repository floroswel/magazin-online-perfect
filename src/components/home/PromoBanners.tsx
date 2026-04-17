import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const FALLBACK_BANNERS = [
  {
    badge: "COLECȚIA 2025",
    title: "Lumânări Premium",
    subtitle: "De la 49 lei",
    cta: "Cumpără Acum →",
    link: "/catalog",
    emoji: "🕯",
    gradient: "linear-gradient(135deg, hsl(217 100% 40%) 0%, hsl(217 100% 50%) 60%, hsl(217 100% 63%) 100%)",
  },
  {
    badge: "TRANSPORT GRATUIT",
    title: "Comenzi > 200 lei",
    subtitle: "Livrăm în toată România",
    cta: "Descoperă Acum →",
    link: "/catalog",
    emoji: "🚚",
    gradient: "linear-gradient(135deg, hsl(12 100% 40%) 0%, hsl(12 100% 50%) 60%, hsl(12 80% 60%) 100%)",
  },
];

export default function PromoBanners() {
  const queryClient = useQueryClient();

  const { data: dbBanners } = useQuery({
    queryKey: ["promo-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", "promo")
        .eq("active", true)
        .order("sort_order")
        .limit(2);
      return data || [];
    },
    staleTime: 0,
  });

  // Realtime: instantly refresh when banners change in admin
  useEffect(() => {
    const channel = supabase
      .channel("promo-banners-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const banners = dbBanners && dbBanners.length > 0
    ? dbBanners.map((b: any) => ({
        badge: b.badge_text || "",
        title: b.title,
        subtitle: b.subtitle || "",
        cta: b.cta_text || "Descoperă →",
        link: b.cta_link || b.link_url || "/catalog",
        emoji: "",
        gradient: b.bg_color
          ? `linear-gradient(135deg, ${b.bg_color}, ${b.bg_color}dd)`
          : "linear-gradient(135deg, hsl(217 100% 40%) 0%, hsl(217 100% 63%) 100%)",
        image_url: b.image_url,
      }))
    : FALLBACK_BANNERS;

  return (
    <section className="bg-secondary py-4">
      <div className="ml-container grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b: any, i: number) => (
          <Link
            key={i}
            to={b.link}
            className="relative flex items-center justify-between rounded-xl overflow-hidden h-[150px] px-6 md:px-8 hover:scale-[1.01] transition-transform"
            style={{ background: b.gradient }}
          >
            <div className="relative z-10">
              {b.badge && (
                <span className="text-[10px] font-bold text-white/90 bg-white/20 rounded-full px-2.5 py-0.5 inline-block mb-2">
                  {b.badge}
                </span>
              )}
              <h3 className="text-lg md:text-xl font-extrabold text-white">{b.title}</h3>
              <p className="text-sm text-white/85 mb-3">{b.subtitle}</p>
              <span className="inline-block text-xs font-bold bg-white text-foreground px-3 py-1.5 rounded-md">
                {b.cta}
              </span>
            </div>
            {b.image_url ? (
              <img src={b.image_url} alt="" className="h-full w-24 object-contain" />
            ) : b.emoji ? (
              <span className="text-5xl md:text-6xl">{b.emoji}</span>
            ) : null}
            <div className="absolute -right-5 -top-5 w-[120px] h-[120px] rounded-full bg-white/10" />
          </Link>
        ))}
      </div>
    </section>
  );
}
