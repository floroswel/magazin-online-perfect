import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Clock } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export default function FlashDeals() {
  const [deals, setDeals] = useState<Tables<"products">[]>([]);
  const countdown = useCountdown();

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .not("old_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setDeals(data || []));
  }, []);

  if (deals.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-card py-8 border-y border-border">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-destructive">
              <Flame className="h-6 w-6" />
              <h2 className="text-2xl font-bold text-foreground">Oferte Flash</h2>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono bg-foreground text-background rounded-md px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{pad(countdown.h)}</span>:<span>{pad(countdown.m)}</span>:<span>{pad(countdown.s)}</span>
            </div>
          </div>
          <Link to="/catalog" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
            Vezi toate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
