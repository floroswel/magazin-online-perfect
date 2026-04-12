import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, Star, Shield } from "lucide-react";

export default function OrderCounter() {
  const { data: stats } = useQuery({
    queryKey: ["store-stats"],
    queryFn: async () => {
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
      const { count: reviewCount } = await supabase.from("product_reviews").select("*", { count: "exact", head: true }).eq("status", "approved");
      return { orders: orderCount || 0, reviews: reviewCount || 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = [
    { icon: Package, value: `${Math.max(500, stats?.orders || 0).toLocaleString("ro-RO")}+`, label: "Comenzi procesate" },
    { icon: Users, value: "2000+", label: "Clienți mulțumiți" },
    { icon: Star, value: `${Math.max(100, stats?.reviews || 0).toLocaleString("ro-RO")}+`, label: "Recenzii pozitive" },
    { icon: Shield, value: "100%", label: "Plăți securizate" },
  ];

  return (
    <section className="py-8 bg-secondary/30">
      <div className="lumax-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
