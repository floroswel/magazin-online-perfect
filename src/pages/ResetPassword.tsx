import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Parolele nu se potrivesc"); return; }
    if (password.length < 6) { toast.error("Minim 6 caractere"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); } else { toast.success("Parola a fost schimbată!"); navigate("/auth"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-6 text-3xl font-display font-medium text-foreground tracking-tight">
        Mama Lucica <span className="text-accent">🕯️</span>
      </Link>
      <div className="w-full max-w-md bg-card border border-border rounded-sm shadow-md p-8">
        <h2 className="text-2xl font-display text-center text-foreground mb-1">Setează parola nouă</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Alege o parolă sigură de minim 6 caractere</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Parolă nouă *" type={showPw ? "text" : "password"} required className="w-full h-11 px-3 pr-10 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmă parola *" type="password" required className="w-full h-11 px-3 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
          {password.length > 0 && (
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${password.length >= 8 ? "bg-ml-success w-full" : password.length >= 6 ? "bg-ml-warning w-2/3" : "bg-destructive w-1/3"}`} />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground rounded-sm font-semibold text-sm tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? "Se salvează..." : "Salvează parola"}
          </button>
        </form>
      </div>
    </div>
  );
}
