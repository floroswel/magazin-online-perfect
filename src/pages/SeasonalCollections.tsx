import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Gift, Snowflake, Heart, Flower2, Sun, Timer, Package, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import CountdownTimer from "@/components/products/CountdownTimer";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface SeasonalCollection {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  tags: string[];
  startMonth: number;
  endMonth: number;
  countdownLabel: string;
}

const SEASONS: SeasonalCollection[] = [
  {
    key: "valentine",
    name: "Valentine's Day",
    description: "Lumânări romantice pentru cei dragi. Arome de trandafir, vanilie și mosc.",
    icon: <Heart className="w-6 h-6" />,
    gradient: "from-rose-500 to-pink-600",
    tags: ["valentine", "romantic", "dragoste", "cuplu", "trandafir"],
    startMonth: 1,
    endMonth: 2,
    countdownLabel: "14 Februarie",
  },
  {
    key: "8martie",
    name: "8 Martie",
    description: "Cadouri speciale pentru femeile din viața ta. Seturi elegante și arome florale.",
    icon: <Flower2 className="w-6 h-6" />,
    gradient: "from-purple-500 to-fuchsia-600",
    tags: ["8martie", "femei", "primavara", "floral", "cadou-ea"],
    startMonth: 2,
    endMonth: 3,
    countdownLabel: "8 Martie",
  },
  {
    key: "paste",
    name: "Paște",
    description: "Lumânări festive pentru masa de Paște. Arome proaspete de primăvară.",
    icon: <Sun className="w-6 h-6" />,
    gradient: "from-amber-400 to-orange-500",
    tags: ["paste", "primavara", "festiv", "traditional"],
    startMonth: 3,
    endMonth: 4,
    countdownLabel: "Paște",
  },
  {
    key: "vara",
    name: "Colecția de Vară",
    description: "Arome fresh de citrice, ocean și fructe tropicale pentru serile de vară.",
    icon: <Sun className="w-6 h-6" />,
    gradient: "from-cyan-400 to-blue-500",
    tags: ["vara", "citrice", "ocean", "tropical", "fresh"],
    startMonth: 5,
    endMonth: 8,
    countdownLabel: "Toată vara",
  },
  {
    key: "craciun",
    name: "Crăciun",
    description: "Magia sărbătorilor în fiecare lumânare. Scorțișoară, brad și portocale.",
    icon: <Snowflake className="w-6 h-6" />,
    gradient: "from-red-600 to-green-700",
    tags: ["craciun", "sarbatori", "iarna", "scortisoara", "brad", "cadou"],
    startMonth: 11,
    endMonth: 12,
    countdownLabel: "25 Decembrie",
  },
];

function getActiveSeasons(): SeasonalCollection[] {
  const month = new Date().getMonth() + 1;
  return SEASONS.filter(s => {
    if (s.startMonth <= s.endMonth) {
      return month >= s.startMonth && month <= s.endMonth;
    }
    return month >= s.startMonth || month <= s.endMonth;
  });
}

function getSeasonCountdownDate(season: SeasonalCollection): string | null {
  const now = new Date();
  const year = now.getFullYear();
  
  if (season.key === "valentine") {
    const target = new Date(year, 1, 14, 23, 59, 59);
    return target > now ? target.toISOString() : null;
  }
  if (season.key === "8martie") {
    const target = new Date(year, 2, 8, 23, 59, 59);
    return target > now ? target.toISOString() : null;
  }
  if (season.key === "craciun") {
    const target = new Date(year, 11, 25, 23, 59, 59);
    return target > now ? target.toISOString() : null;
  }
  return null;
}

export default function SeasonalCollections() {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<string>("all");

  usePageSeo({
    title: "Colecții Sezoniere — Lumânări pentru Fiecare Anotimp | MamaLucica",
    description: "Descoperă colecțiile noastre sezoniere de lumânări artizanale. Valentine's Day, 8 Martie, Paște, vară și Crăciun — arome speciale în ediție limitată.",
  });

  const activeSeasons = useMemo(() => getActiveSeasons(), []);
  const allSeasons = SEASONS;

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, bundlesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("visible", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("bundle_products")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setProducts(productsRes.data || []);
      setBundles(bundlesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSeasonProducts = (season: SeasonalCollection) => {
    return products.filter(p => {
      const searchable = `${p.name} ${p.description || ""} ${(p.tags as string[] || []).join(" ")}`.toLowerCase();
      return season.tags.some(tag => searchable.includes(tag));
    });
  };

  const displaySeasons = activeSeason === "all" ? allSeasons : allSeasons.filter(s => s.key === activeSeason);

  return (
    <Layout>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary/90 to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 left-12 text-7xl rotate-12 hidden md:block">🎄</div>
          <div className="absolute bottom-6 right-20 text-6xl -rotate-6 hidden md:block">🎁</div>
          <div className="absolute top-10 right-32 text-5xl rotate-45 hidden md:block">❄️</div>
        </div>
        <div className="container px-4 py-8 md:py-14 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-foreground/20 p-2.5 rounded-xl">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground">
                Colecții Sezoniere
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                Ediții limitate • Stocuri reduse • Arome exclusive
              </p>
            </div>
          </div>

          {/* Active season badges */}
          {activeSeasons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeSeasons.map(s => {
                const countdown = getSeasonCountdownDate(s);
                return (
                  <div key={s.key} className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-primary-foreground">{s.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-primary-foreground">{s.name}</p>
                      {countdown && (
                        <CountdownTimer endsAt={countdown} className="!text-primary-foreground/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Season filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveSeason("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeSeason === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border hover:border-primary/50"
            }`}
          >
            Toate colecțiile
          </button>
          {allSeasons.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSeason(s.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                activeSeason === s.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-border hover:border-primary/50"
              }`}
            >
              {s.icon}
              {s.name}
            </button>
          ))}
        </div>

        {/* Season sections */}
        {displaySeasons.map(season => {
          const seasonProducts = getSeasonProducts(season);
          const countdown = getSeasonCountdownDate(season);
          const isActive = activeSeasons.some(a => a.key === season.key);

          return (
            <section key={season.key} className="mb-10">
              <div className={`relative rounded-2xl bg-gradient-to-r ${season.gradient} p-5 md:p-8 mb-5 overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <Package className="w-full h-full" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white">{season.icon}</span>
                    <h2 className="text-xl md:text-2xl font-bold text-white">{season.name}</h2>
                    {isActive && (
                      <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        ✨ Acum activ
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm max-w-lg">{season.description}</p>
                  {countdown && (
                    <div className="mt-3 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-white/70" />
                      <CountdownTimer endsAt={countdown} className="!text-white/90 !text-sm" />
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Se încarcă...</div>
              ) : seasonProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                  {seasonProducts.slice(0, 10).map(p => (
                    <div key={p.id} className="relative">
                      {p.stock !== null && p.stock <= 5 && p.stock > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Doar {p.stock} buc!
                        </div>
                      )}
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-xl">
                  <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Colecția {season.name} va fi disponibilă în curând.
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-1">
                    Adaugă produse cu tag-urile: {season.tags.join(", ")}
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
