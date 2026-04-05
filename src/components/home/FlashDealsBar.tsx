import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";

function useCountdownToMidnight() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function FlashDealsBar() {
  const queryClient = useQueryClient();
  const countdown = useCountdownToMidnight();
  const { format } = useCurrency();

  useEffect(() => {
    const channel = supabase
      .channel("flash-deals-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["flash-deals"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: deals } = useQuery({
    queryKey: ["flash-deals"],
    queryFn: async () => {
      // First try products explicitly marked as promo
      const { data: promo } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url")
        .eq("badge_promo", true)
        .eq("status", "active")
        .limit(10);
      if (promo && promo.length > 0) return promo;
      // Fallback: products with old_price (discount)
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url")
        .not("old_price", "is", null)
        .gt("old_price", 0)
        .limit(10);
      return data || [];
    },
  });

  if (!deals || deals.length === 0) return null;

  return (
    <div className="bg-card border-t-[3px] border-destructive border-b border-border overflow-hidden">
      <div className="lumax-container flex items-center h-[60px] gap-4">
        {/* Left label */}
        <div className="flex-shrink-0 flex items-center gap-3 pr-4 border-r-2 border-destructive">
          <span className="text-destructive text-[13px] font-extrabold tracking-wide">⚡ OFERTE FLASH</span>
          <span className="font-mono text-xl font-extrabold text-foreground">{countdown}</span>
        </div>

        {/* Scrolling chips */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-2 animate-ticker whitespace-nowrap">
            {[...deals, ...deals, ...deals].map((p, i) => (
              <Link
                key={`${p.id}-${i}`}
                to={`/product/${p.slug}`}
                className="flex-shrink-0 flex items-center gap-2 h-11 bg-secondary rounded-lg px-3 border border-border hover:border-primary transition-colors"
              >
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <span className="text-xs text-foreground max-w-[100px] truncate">{p.name}</span>
                <span className="text-[13px] font-bold text-destructive">{format(p.price)}</span>
                {p.old_price && (
                  <span className="text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                    -{Math.round((1 - p.price / p.old_price) * 100)}%
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
