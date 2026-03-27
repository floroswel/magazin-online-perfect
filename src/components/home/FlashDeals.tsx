import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isCandleCollection } from "@/lib/candleCatalog";

function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

export default function FlashDeals({ title = "Oferte Limitate" }: { title?: string }) {
  const [deals, setDeals] = useState<Tables<"products">[]>([]);
  const countdown = useCountdown();

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("visible", true)
      .then(({ data: cats }) => {
        const ids = ((cats || []) as Array<{ id: string; name: string; slug: string }>).filter((cat) =>
          isCandleCollection(cat)
        ).map((cat) => cat.id);

        if (ids.length === 0) {
          setDeals([]);
          return;
        }

        supabase
          .from("products")
          .select("*")
          .in("category_id", ids)
          .not("old_price", "is", null)
          .order("created_at", { ascending: false })
          .limit(4)
          .then(({ data }) => setDeals(data || []));
      });
  }, []);

  if (deals.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="py-16 md:py-20 border-y border-border">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-medium">Timp Limitat</p>
            <h2 className="font-serif text-3xl font-medium text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-mono text-foreground bg-muted px-4 py-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{pad(countdown.h)}</span>:<span>{pad(countdown.m)}</span>:<span>{pad(countdown.s)}</span>
            </div>
            <Link to="/catalog" className="hidden md:flex text-sm text-primary hover:text-primary/80 font-medium items-center gap-1.5 tracking-wide transition-colors">
              Vezi toate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {deals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
