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
        .select(`
          id, order_number, status, payment_status, total, created_at,
          order_items (
            id, product_id, product_name, quantity, unit_price, total_price,
            products:product_id ( slug, image_url, name )
          )
        `)
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
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/account" className="hover:text-accent">Cont</Link> / Comenzi
        </nav>
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Comenzile mele</h1>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Se încarcă...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center bg-card border border-border rounded-md">
            <p className="text-muted-foreground mb-4">Nu ai nicio comandă încă.</p>
            <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Începe cumpărăturile</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o: any) => {
              const orderItems = o.order_items || [];
              return (
                <div key={o.id} className="bg-card border border-border rounded-md overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/30">
                    <div>
                      <div className="text-sm font-semibold">Comanda #{o.order_number || o.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })} · {orderItems.length} {orderItems.length === 1 ? "produs" : "produse"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-muted text-xs rounded-sm capitalize">{o.status}</span>
                      <span className="font-bold" style={{ color: "#FF3300" }}>{Number(o.total).toFixed(2)} lei</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 space-y-3">
                    {orderItems.map((it: any) => {
                      const slug = it.products?.slug;
                      const img = it.products?.image_url;
                      const name = it.product_name || it.products?.name || "Produs";
                      const linkProps = slug
                        ? { to: `/produs/${slug}`, className: "flex gap-3 items-center group" }
                        : { to: "#", className: "flex gap-3 items-center pointer-events-none opacity-80" };
                      return (
                        <Link key={it.id} {...linkProps}>
                          {img ? (
                            <img src={img} alt={name} loading="lazy" className="w-14 h-14 object-cover rounded-sm border border-border shrink-0" />
                          ) : (
                            <div className="w-14 h-14 bg-muted rounded-sm shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">{name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {it.quantity} × {Number(it.unit_price).toFixed(2)} lei
                            </div>
                          </div>
                          <div className="text-sm font-semibold whitespace-nowrap">
                            {Number(it.total_price ?? it.unit_price * it.quantity).toFixed(2)} lei
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Footer actions */}
                  <div className="p-3 border-t border-border bg-muted/20 flex justify-end gap-2">
                    <Link to={`/track?order=${o.order_number || o.id}`} className="text-sm text-accent hover:underline">
                      Detalii comandă →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
