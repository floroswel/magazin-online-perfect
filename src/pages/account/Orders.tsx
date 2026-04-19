import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

export default function Orders() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("orders")
        .select("id, order_number, status, payment_status, total, created_at, order_items(product_name, quantity)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <StorefrontLayout>
        <div className="ml-container py-20 text-center">
          <h1 className="font-display text-2xl mb-3">Autentificare necesară</h1>
          <Link to="/auth" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Conectează-te</Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <SeoHead title="Comenzile mele — Mama Lucica" description="Istoricul comenzilor tale." />
      <section className="ml-container py-6 lg:py-10">
        <nav className="text-xs text-muted-foreground mb-3"><Link to="/account" className="hover:text-accent">Cont</Link> / Comenzi</nav>
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Comenzile mele</h1>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Se încarcă...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center bg-card border border-border rounded-md">
            <p className="text-muted-foreground mb-4">Nu ai nicio comandă încă.</p>
            <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Începe cumpărăturile</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="p-4 bg-card border border-border rounded-md flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Comanda #{o.order_number || o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")} · {o.order_items?.length || 0} produse</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-muted text-xs rounded-sm">{o.status}</span>
                  <span className="font-bold" style={{ color: "#FF3300" }}>{Number(o.total).toFixed(2)} lei</span>
                  <Link to={`/track?order=${o.order_number || o.id}`} className="text-sm text-accent hover:underline">Detalii →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
