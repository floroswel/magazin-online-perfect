import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  usePageSeo({ title: "Resetare parolă | Mama Lucica", noindex: true });

  useEffect(() => {
    // Supabase auto-signs in with recovery token from hash
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Parolele nu se potrivesc"); return; }
    if (password.length < 6) { toast.error("Minim 6 caractere"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); } else { toast.success("Parola a fost schimbată!"); navigate("/account"); }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="ml-container py-12 max-w-md mx-auto">
        <div className="bg-card rounded-xl border border-border p-8">
          <h1 className="text-2xl font-extrabold text-primary text-center mb-1">Mama Lucica</h1>
          <h2 className="text-lg font-bold text-center mb-6">Setează parola nouă</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Parolă nouă *" type={showPw ? "text" : "password"} required className="w-full h-11 px-3 pr-10 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmă parola *" type="password" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
            {password.length > 0 && (
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${password.length >= 8 ? "bg-ml-success w-full" : password.length >= 6 ? "bg-ml-warning w-2/3" : "bg-destructive w-1/3"}`} />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-ml-primary-dark disabled:opacity-50">
              {loading ? "Se salvează..." : "Salvează parola"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}