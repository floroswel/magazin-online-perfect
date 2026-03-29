import { useState, useEffect } from "react";
import { Ticket, Copy, Check, Gift } from "lucide-react";
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
    (supabase as any)
      .from("coupons")
      .select("id, code, discount_type, discount_value, min_order_value, description")
      .eq("active", true)
      .eq("public_visible", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }: any) => {
        if (data) {
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

    // Load collected from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("collected_coupons") || "[]");
      setCollected(new Set(saved));
    } catch {}
  }, []);

  // Show some fallback coupons if none in DB
  const displayCoupons: Coupon[] = coupons.length > 0 ? coupons : [
    { id: "1", code: "WELCOME10", discount_type: "percentage", discount_value: 10, min_order: 100, description: "10% reducere la prima comandă" },
    { id: "2", code: "LIVRARE0", discount_type: "free_shipping", discount_value: 0, min_order: 150, description: "Transport gratuit" },
    { id: "3", code: "VARA25", discount_type: "percentage", discount_value: 25, min_order: 300, description: "25% reducere la comenzi peste 300 lei" },
  ];

  const handleCollect = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    const next = new Set(collected);
    next.add(coupon.id);
    setCollected(next);
    localStorage.setItem("collected_coupons", JSON.stringify([...next]));
    toast.success(`Cupon ${coupon.code} copiat!`);
  };

  if (displayCoupons.length === 0) return null;

  return (
    <section className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Cupoane Disponibile</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayCoupons.map((coupon) => {
          const isCollected = collected.has(coupon.id);
          return (
            <div
              key={coupon.id}
              className="relative flex items-center bg-card border-2 border-dashed border-primary/30 rounded-lg p-4 hover:border-primary transition-colors overflow-hidden"
            >
              {/* Left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-lg" />

              <div className="flex-1 ml-3">
                <div className="flex items-center gap-2 mb-1">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary text-lg tracking-wider">
                    {coupon.discount_type === "percentage"
                      ? `-${coupon.discount_value}%`
                      : coupon.discount_type === "free_shipping"
                      ? "TRANSPORT GRATUIT"
                      : `-${coupon.discount_value} lei`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{coupon.description || coupon.code}</p>
                {coupon.min_order && (
                  <p className="text-xs text-muted-foreground mt-0.5">Min. comandă: {coupon.min_order} lei</p>
                )}
              </div>

              <button
                onClick={() => handleCollect(coupon)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isCollected
                    ? "bg-[hsl(var(--marketplace-success))]/10 text-[hsl(var(--marketplace-success))] border border-[hsl(var(--marketplace-success))]/30"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isCollected ? (
                  <>
                    <Check className="w-4 h-4" /> Copiat
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Colectează
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
