import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ full_name: data.full_name || "", phone: data.phone || "" });
    });
  }, [user]);

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profil actualizat");
  };

  return (
    <StorefrontLayout>
      <SeoHead title="Setări cont — Mama Lucica" />
      <section className="ml-container py-6 lg:py-10 max-w-2xl">
        <nav className="text-xs text-muted-foreground mb-3"><Link to="/account" className="hover:text-accent">Cont</Link> / Setări</nav>
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Setări cont</h1>

        <form onSubmit={save} className="bg-card border border-border rounded-md p-5 space-y-4 mb-6">
          <h2 className="font-display text-lg">Date personale</h2>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1 block">Email</span>
            <input value={user.email || ""} disabled className="w-full h-11 px-3 border border-border rounded-sm bg-muted text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1 block">Nume complet</span>
            <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full h-11 px-3 border border-border rounded-sm bg-background text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1 block">Telefon</span>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full h-11 px-3 border border-border rounded-sm bg-background text-sm" />
          </label>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-sm">
            {loading ? "Se salvează..." : "Salvează"}
          </button>
        </form>

        <div className="bg-card border border-border rounded-md p-5">
          <h2 className="font-display text-lg mb-3">Securitate</h2>
          <Link to="/forgot-password" className="text-sm text-accent hover:underline block mb-3">Schimbă parola</Link>
          <button onClick={signOut} className="px-4 py-2 border border-destructive text-destructive text-sm rounded-sm hover:bg-destructive hover:text-destructive-foreground">
            Deconectare
          </button>
        </div>
      </section>
    </StorefrontLayout>
  );
}
