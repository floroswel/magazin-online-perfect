import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

export default function Addresses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
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

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("addresses").insert({ ...form, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Adresă adăugată");
    setShowForm(false);
    setForm({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <StorefrontLayout>
      <SeoHead title="Adresele mele — Mama Lucica" />
      <section className="ml-container py-6 lg:py-10">
        <nav className="text-xs text-muted-foreground mb-3"><Link to="/account" className="hover:text-accent">Cont</Link> / Adrese</nav>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl lg:text-3xl">Adresele mele</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adaugă
          </button>
        </div>

        {showForm && (
          <form onSubmit={add} className="bg-card border border-border rounded-md p-5 mb-6 grid sm:grid-cols-2 gap-3">
            <input required placeholder="Nume complet" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input required placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input required placeholder="Adresă" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2 h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input required placeholder="Oraș" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input required placeholder="Județ" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input placeholder="Cod poștal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <input placeholder="Etichetă (Acasă, Birou)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="h-11 px-3 border border-border rounded-sm bg-background text-sm" />
            <button type="submit" className="sm:col-span-2 h-11 bg-accent text-accent-foreground font-semibold rounded-sm">Salvează adresa</button>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="py-12 text-center bg-card border border-border rounded-md">
            <p className="text-muted-foreground">Nu ai adrese salvate.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {addresses.map((a: any) => (
              <div key={a.id} className="p-4 bg-card border border-border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">{a.label || "Adresă"}</span>
                  <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="text-sm font-semibold">{a.full_name}</div>
                <div className="text-sm text-muted-foreground">{a.address}, {a.city}, {a.county} {a.postal_code || ""}</div>
                <div className="text-sm text-muted-foreground">{a.phone}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
