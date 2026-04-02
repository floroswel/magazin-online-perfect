import { useEffect, useState } from "react";
import { Truck, Shield, RotateCcw, Star, Package, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const staticFeatures = [
  { icon: Truck, label: "Livrare Gratuită", desc: "La comenzi peste 200 lei" },
  { icon: Shield, label: "Plată Securizată", desc: "100% protejat" },
  { icon: RotateCcw, label: "Retur Gratuit", desc: "30 zile garanție" },
];

function useRealStats() {
  return useQuery({
    queryKey: ["social-proof-stats"],
    queryFn: async () => {
      const [ordersRes, customersRes, reviewsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["delivered", "confirmed", "shipped"]),
        supabase.from("orders").select("user_id").not("user_id", "is", null),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("rating", 5).eq("status", "approved"),
      ]);

      const uniqueCustomers = new Set((customersRes.data || []).map((o: any) => o.user_id)).size;

      return {
        ordersDelivered: ordersRes.count || 0,
        happyCustomers: uniqueCustomers,
        fiveStarReviews: reviewsRes.count || 0,
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

export default function SocialProofBar() {
  const ref = useScrollReveal();
  const { data: stats } = useRealStats();

  const dynamicFeatures = [
    { icon: Package, label: `${stats?.ordersDelivered || 0}+ Comenzi`, desc: "Livrate cu succes" },
    { icon: Users, label: `${stats?.happyCustomers || 0}+ Clienți`, desc: "Mulțumiți" },
    { icon: Star, label: `${stats?.fiveStarReviews || 0}+ Recenzii`, desc: "De 5 stele ★" },
  ];

  const features = [...staticFeatures, ...dynamicFeatures];

  return (
    <section className="bg-card border-b border-border py-4 md:py-6" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 reveal stagger-1">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-card-foreground leading-tight">{f.label}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
