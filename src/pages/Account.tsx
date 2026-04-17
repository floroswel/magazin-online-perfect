import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { Package, Heart, MapPin, Star, LogOut, RotateCcw, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import useRomaniaGeo from "@/hooks/useRomaniaGeo";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/integrations/supabase/types";

type Tab = "dashboard" | "orders" | "wishlist" | "loyalty" | "addresses";

type AddrForm = {
  full_name: string;
  phone: string;
  address: string;
  postal_code: string;
  countyId: string;
  localityName: string;
  label: string;
  is_default: boolean;
};

const emptyAddrForm = (): AddrForm => ({
  full_name: "",
  phone: "",
  address: "",
  postal_code: "",
  countyId: "",
  localityName: "",
  label: "Acasă",
  is_default: false,
});

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { format } = useCurrency();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const { judete, localitati, fetchLocalitati, clearLocalitati, loadingLocalitati } = useRomaniaGeo();
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState<AddrForm>(emptyAddrForm);
  const [addrSaving, setAddrSaving] = useState(false);

  usePageSeo({ title: "Contul meu | Mama Lucica", noindex: true });

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

  const { data: addresses = [] } = useQuery({
    queryKey: ["my-addresses", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      return (data || []) as Tables<"addresses">[];
    },
    enabled: !!user?.id && tab === "addresses",
  });

  const totalPoints = loyaltyPoints?.reduce((s, p) => s + (p.points || 0), 0) || 0;

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddrForm(emptyAddrForm());
    clearLocalitati();
    setAddrDialogOpen(true);
  };

  const openEditAddress = (a: Tables<"addresses">) => {
    setEditingAddressId(a.id);
    const j = judete.find((x) => x.nume === a.county);
    const countyId = j ? String(j.id) : "";
    setAddrForm({
      full_name: a.full_name,
      phone: a.phone,
      address: a.address,
      postal_code: a.postal_code || "",
      countyId,
      localityName: a.city,
      label: a.label || "Acasă",
      is_default: !!a.is_default,
    });
    setAddrDialogOpen(true);
    if (j) fetchLocalitati(j.id);
    else clearLocalitati();
  };

  const saveAddress = async () => {
    if (!user) return;
    const f = addrForm;
    if (!f.full_name.trim() || !f.phone.trim() || !f.address.trim() || !f.countyId || !f.localityName.trim()) {
      toast.error("Completează câmpurile obligatorii.");
      return;
    }
    const jud = judete.find((x) => String(x.id) === f.countyId);
    if (!jud) return;
    setAddrSaving(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: f.full_name.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        city: f.localityName.trim(),
        county: jud.nume,
        postal_code: f.postal_code.trim() || null,
        label: f.label.trim() || null,
        is_default: f.is_default,
      };
      if (f.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      if (editingAddressId) {
        const { error } = await supabase.from("addresses").update(payload).eq("id", editingAddressId).eq("user_id", user.id);
        if (error) throw error;
        toast.success("Adresa a fost actualizată.");
      } else {
        const { error } = await supabase.from("addresses").insert(payload);
        if (error) throw error;
        toast.success("Adresa a fost salvată.");
      }
      setAddrDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-addresses", user.id] });
    } catch (e: any) {
      toast.error(e?.message || "Eroare la salvare");
    } finally {
      setAddrSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user || !confirm("Ștergi această adresă?")) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
    if (error) toast.error("Nu s-a putut șterge");
    else {
      toast.success("Adresa a fost ștearsă");
      queryClient.invalidateQueries({ queryKey: ["my-addresses", user.id] });
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
    if (error) toast.error("Eroare");
    else {
      toast.success("Adresa implicită a fost setată");
      queryClient.invalidateQueries({ queryKey: ["my-addresses", user.id] });
    }
  };

  const localityOptions = useMemo(() => {
    return localitati.map((l) => ({ value: l.nume, label: l.nume }));
  }, [localitati]);
  const initials = (profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  const statusColors: Record<string, string> = {
    pending: "bg-ml-warning text-foreground",
    confirmed: "bg-primary/10 text-primary",
    shipped: "bg-primary text-primary-foreground",
    delivered: "bg-ml-success text-white",
    cancelled: "bg-destructive/10 text-destructive",
  };

  if (authLoading) return <Layout><div className="ml-container py-20 text-center"><div className="h-8 w-32 skeleton rounded mx-auto" /></div></Layout>;

  const navItems = [
    { id: "dashboard" as Tab, icon: Package, label: "Dashboard" },
    { id: "orders" as Tab, icon: Package, label: "Comenzile mele" },
    { id: "wishlist" as Tab, icon: Heart, label: "Favorite" },
    { id: "loyalty" as Tab, icon: Star, label: "Puncte fidelitate" },
    { id: "addresses" as Tab, icon: MapPin, label: "Adresele mele" },
  ];

  return (
    <Layout>
      <div className="ml-container py-6 pb-12">
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
                            <button
                              onClick={async () => {
                                try {
                                  toast.info("Se generează factura...");
                                  const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
                                    body: { orderId: o.id },
                                  });
                                  if (error) throw error;
                                  // data is arraybuffer
                                  const blob = new Blob([data], { type: "application/pdf" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `Factura_ML_${o.order_number || o.id.slice(0, 8)}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  toast.success("Factura a fost descărcată!");
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Eroare la generarea facturii");
                                }
                              }}
                              className="shrink-0 text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3.5 w-3.5" /> Factură PDF
                            </button>
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
                        <span className={`text-sm font-bold ${lp.points > 0 ? "text-ml-success" : "text-destructive"}`}>
                          {lp.points > 0 ? "+" : ""}{lp.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Adresele mele</h2>
                  <Button size="sm" onClick={openNewAddress} className="gap-1">
                    <Plus className="h-4 w-4" /> Adaugă adresă nouă
                  </Button>
                </div>
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nu ai încă adrese salvate.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{a.full_name} · {a.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {a.address}, {a.city}, {a.county}
                            {a.postal_code ? `, ${a.postal_code}` : ""}
                          </p>
                          {a.label && <p className="text-xs text-muted-foreground mt-1">{a.label}</p>}
                          {a.is_default && (
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase bg-primary/15 text-primary px-2 py-0.5 rounded">Implicită</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!a.is_default && (
                            <Button variant="outline" size="sm" onClick={() => setDefaultAddress(a.id)}>
                              Setează ca implicită
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => openEditAddress(a)} className="gap-1">
                            <Pencil className="h-3.5 w-3.5" /> Editează
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAddress(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddressId ? "Editează adresa" : "Adresă nouă"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nume complet</Label>
                <Input value={addrForm.full_name} onChange={(e) => setAddrForm((s) => ({ ...s, full_name: e.target.value }))} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={addrForm.phone} onChange={(e) => setAddrForm((s) => ({ ...s, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Adresă (stradă, număr, bloc)</Label>
              <Input value={addrForm.address} onChange={(e) => setAddrForm((s) => ({ ...s, address: e.target.value }))} />
            </div>
            <div>
              <Label>Cod poștal</Label>
              <Input value={addrForm.postal_code} onChange={(e) => setAddrForm((s) => ({ ...s, postal_code: e.target.value }))} />
            </div>
            <div>
              <Label>Județ</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={addrForm.countyId}
                onChange={(e) => {
                  const v = e.target.value;
                  setAddrForm((s) => ({ ...s, countyId: v, localityName: "" }));
                  if (v) fetchLocalitati(parseInt(v, 10));
                  else clearLocalitati();
                }}
              >
                <option value="">Selectează județul</option>
                {judete.map((j) => (
                  <option key={j.id} value={String(j.id)}>{j.nume}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Localitate</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={!addrForm.countyId || loadingLocalitati}
                value={addrForm.localityName}
                onChange={(e) => setAddrForm((s) => ({ ...s, localityName: e.target.value }))}
              >
                <option value="">{loadingLocalitati ? "Se încarcă..." : "Selectează localitatea"}</option>
                {localityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Etichetă (opțional)</Label>
              <Input value={addrForm.label} onChange={(e) => setAddrForm((s) => ({ ...s, label: e.target.value }))} placeholder="Acasă, Serviciu..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="addr-default"
                checked={addrForm.is_default}
                onCheckedChange={(c) => setAddrForm((s) => ({ ...s, is_default: !!c }))}
              />
              <Label htmlFor="addr-default" className="font-normal cursor-pointer">Adresă implicită pentru livrare</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddrDialogOpen(false)}>Anulează</Button>
            <Button onClick={saveAddress} disabled={addrSaving}>{addrSaving ? "Se salvează..." : "Salvează"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
