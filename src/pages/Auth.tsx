import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePageSeo } from "@/components/SeoHead";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  usePageSeo({ title: mode === "login" ? "Autentificare | LUMAX" : "Crează cont | LUMAX", noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (password !== confirmPassword) { setError("Parolele nu se potrivesc"); setLoading(false); return; }
        if (password.length < 6) { setError("Parola trebuie să aibă minim 6 caractere"); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) { setError(error.message); } else { setRegisterSuccess(true); }
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError("Email sau parolă incorectă"); } else { toast.success("Bun venit!"); navigate("/account"); }
      }
    } catch { setError("A apărut o eroare"); }
    finally { setLoading(false); }
  };

  if (registerSuccess) {
    return (
      <Layout>
        <div className="lumax-container py-20 max-w-md mx-auto text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold mb-2">Cont creat cu succes!</h1>
          <p className="text-sm text-muted-foreground">Verifică email-ul pentru confirmare.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lumax-container py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-primary">LUMAX</h1>
              <h2 className="text-lg font-bold mt-2">{mode === "login" ? "Bun venit!" : "Creează cont"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{mode === "login" ? "Autentifică-te în contul tău" : "Creează un cont nou"}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nume complet *" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
              )}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Parolă *" type={showPassword ? "text" : "password"} required className="w-full h-11 px-3 pr-10 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "register" && (
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmă parola *" type="password" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
              )}
              {mode === "login" && (
                <div className="text-right"><Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">Ai uitat parola?</Link></div>
              )}
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-lumax-blue-dark disabled:opacity-50">
                {loading ? "Se procesează..." : mode === "login" ? "Autentifică-te" : "Creează cont"}
              </button>
            </form>
            <div className="relative my-6"><hr className="border-border" /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">sau</span></div>
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full h-11 border-2 border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
              {mode === "login" ? "Creează un cont nou" : "Am deja cont — Autentifică-te"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}