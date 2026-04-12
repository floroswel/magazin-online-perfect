import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { Package, Heart, MapPin, Star, Settings, LogOut, RotateCcw } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

type Tab = "dashboard" | "orders" | "wishlist" | "loyalty";

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");

  usePageSeo({ title: "Contul meu | LUMAX", noindex: true });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!user?.id && (tab === "dashboard" || tab === "orders"),
  });

  const { data: favorites } = useQuery({
    queryKey: ["my-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product:products(*)").eq("user_id", user!.id);
      return data?.map((f: any) => f.product).filter(Boolean) || [];
    },
    enabled: !!user?.id && tab === "wishlist",
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ["my-loyalty", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_points").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user?.id && tab === "loyalty",
  });

  const totalPoints = loyaltyPoints?.reduce((s, p) => s + (p.points || 0), 0) || 0;
  const initials = (profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  const statusColors: Record<string, string> = {
    pending: "bg-lumax-yellow text-foreground",
    confirmed: "bg-primary/10 text-primary",
    shipped: "bg-primary text-primary-foreground",
    delivered: "bg-lumax-green text-white",
    cancelled: "bg-destructive/10 text-destructive",
  };

  if (authLoading) return <Layout><div className="lumax-container py-20 text-center"><div className="h-8 w-32 skeleton rounded mx-auto" /></div></Layout>;

  const navItems = [
    { id: "dashboard" as Tab, icon: Package, label: "Dashboard" },
    { id: "orders" as Tab, icon: Package, label: "Comenzile mele" },
    { id: "wishlist" as Tab, icon: Heart, label: "Favorite" },
    { id: "loyalty" as Tab, icon: Star, label: "Puncte fidelitate" },
  ];

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12">
        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-2">{initials}</div>
              <p className="text-sm font-bold text-foreground">{profile?.full_name || "Utilizator"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <hr className="border-border mb-3" />
            <nav className="space-y-1">
              {navItems.map(n => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === n.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </button>
              ))}
              <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-4 w-4" /> Deconectare
              </button>
            </nav>
          </div>

          {/* Content */}
          <div>
            {tab === "dashboard" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold">Bine ai venit, {profile?.full_name?.split(" ")[0] || ""}!</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{orders?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Comenzi</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">Puncte</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{favorites?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Favorite</p>
                  </div>
                </div>
                {orders && orders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold mb-3">Ultimele comenzi</h3>
                    <div className="space-y-2">
                      {orders.slice(0, 3).map((o: any) => (
                        <div key={o.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">#{o.order_number || o.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[o.status] || "bg-secondary text-muted-foreground"}`}>{o.status}</span>
                            <p className="text-sm font-bold mt-1">{format(o.total || 0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "orders" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Comenzile mele</h2>
                {orders && orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((o: any) => (
                      <div key={o.id} className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold">Comanda #{o.order_number || o.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[o.status] || "bg-secondary text-muted-foreground"}`}>{o.status}</span>
                            <p className="text-base font-extrabold mt-1">{format(o.total || 0)}</p>
                          </div>
                        </div>
                        {o.items && o.items.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex gap-2 overflow-x-auto flex-1">
                              {o.items.slice(0, 4).map((item: any) => (
                                <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                  <img src={item.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {o.items.length > 4 && <span className="text-xs text-muted-foreground self-center">+{o.items.length - 4}</span>}
                            </div>
                            {(o.status === "delivered" || o.status === "livrat" || o.status === "confirmed") && (
                              <button
                                onClick={async () => {
                                  for (const item of o.items) {
                                    if (item.product_id) await addToCart(item.product_id, item.quantity || 1);
                                  }
                                  toast.success("Produsele au fost adăugate în coș!");
                                }}
                                className="shrink-0 text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Recomandă
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nu ai comenzi încă.</p>
                )}
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Favorite</h2>
                {favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favorites.map((p: any) => <ProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nu ai produse salvate.</p>
                )}
              </div>
            )}

            {tab === "loyalty" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Puncte fidelitate</h2>
                <div className="bg-primary text-primary-foreground rounded-xl p-6 mb-6 text-center">
                  <p className="text-4xl font-black">{totalPoints}</p>
                  <p className="text-sm opacity-80">puncte = {format(Math.floor(totalPoints / 100) * 5)}</p>
                </div>
                {loyaltyPoints && loyaltyPoints.length > 0 && (
                  <div className="space-y-2">
                    {loyaltyPoints.map((lp: any) => (
                      <div key={lp.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">{lp.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(lp.created_at).toLocaleDateString("ro-RO")}</p>
                        </div>
                        <span className={`text-sm font-bold ${lp.points > 0 ? "text-lumax-green" : "text-destructive"}`}>
                          {lp.points > 0 ? "+" : ""}{lp.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
