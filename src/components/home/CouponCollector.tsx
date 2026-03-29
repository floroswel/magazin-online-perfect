import { useState, useEffect } from "react";
import { Ticket, Copy, Check, Gift, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number | null;
  description: string | null;
}

export default function CouponCollector() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [collected, setCollected] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, min_order_value, description")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCoupons(
            data.map((c: any) => ({
              id: c.id,
              code: c.code,
              discount_type: c.discount_type,
              discount_value: c.discount_value,
              min_order: c.min_order_value,
              description: c.description,
            }))
          );
        }
      });

    try {
      const saved = JSON.parse(localStorage.getItem("collected_coupons") || "[]");
      setCollected(new Set(saved));
    } catch {}
  }, []);

  const displayCoupons: Coupon[] = coupons.length > 0 ? coupons : [
    { id: "1", code: "WELCOME10", discount_type: "percentage", discount_value: 10, min_order: 100, description: "10% reducere la prima comandă" },
    { id: "2", code: "LIVRARE0", discount_type: "free_shipping", discount_value: 0, min_order: 150, description: "Transport gratuit la comenzi peste 150 lei" },
    { id: "3", code: "VARA25", discount_type: "percentage", discount_value: 25, min_order: 300, description: "25% reducere la comenzi peste 300 lei" },
  ];

  const handleCollect = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    const next = new Set(collected);
    next.add(coupon.id);
    setCollected(next);
    localStorage.setItem("collected_coupons", JSON.stringify([...next]));
    toast.success(`Cupon ${coupon.code} copiat în clipboard!`);
  };

  const getDiscountLabel = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") return `-${coupon.discount_value}%`;
    if (coupon.discount_type === "free_shipping") return "GRATUIT";
    return `-${coupon.discount_value} lei`;
  };

  const getDiscountColor = (coupon: Coupon) => {
    if (coupon.discount_value >= 25 || coupon.discount_type === "free_shipping") return "bg-primary text-primary-foreground";
    if (coupon.discount_value >= 15) return "bg-accent text-accent-foreground";
    return "bg-muted text-foreground";
  };

  if (displayCoupons.length === 0) return null;

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Cupoane Disponibile</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Colectează și folosește la checkout pentru reduceri instant</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {displayCoupons.map((coupon) => {
          const isCollected = collected.has(coupon.id);
          return (
            <div
              key={coupon.id}
              className={`group relative bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                isCollected ? "border-primary/40" : "border-border hover:border-primary/60"
              }`}
            >
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary to-accent" />

              <div className="p-4 flex items-center gap-4">
                {/* Discount badge */}
                <div className={`shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${getDiscountColor(coupon)}`}>
                  <Sparkles className="w-3.5 h-3.5 mb-0.5 opacity-70" />
                  <span className="text-sm font-extrabold leading-tight">{getDiscountLabel(coupon)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
                    <code className="text-xs font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {coupon.code}
                    </code>
                  </div>
                  <p className="text-sm text-card-foreground line-clamp-1">{coupon.description || coupon.code}</p>
                  {coupon.min_order && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Min. comandă: {coupon.min_order} lei</p>
                  )}
                </div>

                {/* Collect button */}
                <button
                  onClick={() => handleCollect(coupon)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
                    isCollected
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                  }`}
                >
                  {isCollected ? (
                    <><Check className="w-3.5 h-3.5" /> Copiat</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Ia cupon</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
