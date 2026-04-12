import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { Package, CheckCircle2, Truck, MapPin, Search } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Plasată", icon: Package },
  { key: "confirmed", label: "Confirmată", icon: CheckCircle2 },
  { key: "shipped", label: "Expediată", icon: Truck },
  { key: "delivered", label: "Livrată", icon: MapPin },
];

const statusIndex: Record<string, number> = {
  pending: 0, pending_payment: 0, confirmed: 1, processing: 1,
  shipped: 2, shipping: 2, in_transit: 2,
  delivered: 3, livrat: 3,
};

export default function Tracking() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  usePageSeo({ title: "Tracking comandă | Mama Lucica", description: "Verifică statusul comenzii tale în timp real." });

  const { data: order, isLoading } = useQuery({
    queryKey: ["track-order", searchTerm, user?.id],
    queryFn: async () => {
      if (!searchTerm) return null;
      let q = supabase.from("orders").select("id, order_number, status, created_at, awb_number, delivered_at, total, shipping_total")
        .or(`order_number.eq.${searchTerm},awb_number.eq.${searchTerm}`);
      if (user?.id) q = q.eq("user_id", user.id);
      const { data } = await q.limit(1).maybeSingle();
      return data;
    },
    enabled: !!searchTerm,
  });

  const currentStep = order ? (statusIndex[order.status] ?? 0) : -1;

  return (
    <Layout>
      <div className="lumax-container py-8 pb-16 max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground mb-2 text-center">📦 Tracking Comandă</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Introdu numărul comenzii sau AWB-ul pentru a verifica statusul.</p>

        {/* Search */}
        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearchTerm(searchInput.trim())}
              placeholder="Nr. comandă sau AWB..."
              className="w-full h-12 pl-10 pr-4 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            onClick={() => setSearchTerm(searchInput.trim())}
            className="h-12 px-6 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90"
          >
            Caută
          </button>
        </div>

        {isLoading && <div className="text-center text-muted-foreground text-sm py-8">Se caută...</div>}

        {searchTerm && !isLoading && !order && (
          <div className="text-center py-12 bg-secondary/50 rounded-xl">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-semibold text-foreground">Comanda nu a fost găsită</p>
            <p className="text-xs text-muted-foreground mt-1">Verifică numărul introdus și încearcă din nou.</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Order info */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-extrabold">Comanda #{order.order_number || order.id.slice(0, 8)}</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">{order.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">Plasată pe {new Date(order.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</p>
              {order.awb_number && (
                <p className="text-xs text-muted-foreground mt-1">AWB: <span className="font-mono font-semibold text-foreground">{order.awb_number}</span></p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="relative flex items-start justify-between">
                {/* Connection line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-border z-0" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-700"
                  style={{ width: currentStep >= 3 ? "calc(100% - 40px)" : `${(currentStep / 3) * 100}%` }}
                />
                
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center" style={{ width: "25%" }}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        done ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-muted-foreground border-2 border-border"
                      } ${active ? "ring-4 ring-primary/20 scale-110" : ""}`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <p className={`text-[11px] font-semibold mt-2 text-center ${done ? "text-primary" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.delivered_at && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-primary">
                  ✅ Coletul a fost livrat pe {new Date(order.delivered_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
