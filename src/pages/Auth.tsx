import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePageSeo } from "@/components/SeoHead";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import LegalConsents, { EMPTY_CONSENTS, allConsentsAccepted, type LegalConsentsState } from "@/components/storefront/LegalConsents";

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
  const [consents, setConsents] = useState<LegalConsentsState>(EMPTY_CONSENTS);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  usePageSeo({ title: mode === "login" ? "Autentificare | Mama Lucica" : "Crează cont | Mama Lucica", noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!allConsentsAccepted(consents)) { setError("Trebuie să bifezi toate documentele legale"); setLoading(false); return; }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-6 text-3xl font-display font-medium text-foreground tracking-tight">
        Mama Lucica <span className="text-accent">🕯️</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-sm shadow-md p-8">
        {registerSuccess ? (
          <div className="text-center">
            <p className="text-5xl mb-4">✅</p>
            <h1 className="text-2xl font-display mb-2">Cont creat cu succes!</h1>
            <p className="text-sm text-muted-foreground mb-6">Verifică email-ul pentru confirmare.</p>
            <Link to="/auth" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-sm font-semibold text-sm">
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display text-foreground">{mode === "login" ? "Bun venit" : "Cont nou"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" ? "Autentifică-te pentru a continua" : "Creează un cont MamaLucica"}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nume complet *" required className="w-full h-11 px-3 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
              )}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" required className="w-full h-11 px-3 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Parolă *" type={showPassword ? "text" : "password"} required className="w-full h-11 px-3 pr-10 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "register" && (
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmă parola *" type="password" required className="w-full h-11 px-3 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
              )}
              {mode === "login" && (
                <div className="text-right"><Link to="/forgot-password" className="text-xs text-accent font-semibold hover:underline">Ai uitat parola?</Link></div>
              )}
              {mode === "register" && (
                <LegalConsents value={consents} onChange={setConsents} idPrefix="signup" compact />
              )}
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-sm p-3">{error}</p>}
              <button type="submit" disabled={loading || (mode === "register" && !allConsentsAccepted(consents))} className="w-full h-12 bg-primary text-primary-foreground rounded-sm font-semibold text-sm tracking-wide hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                {loading ? "Se procesează..." : mode === "login" ? "Autentifică-te" : "Creează cont"}
              </button>
            </form>
            <div className="relative my-6">
              <hr className="border-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">sau</span>
            </div>
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full h-11 border border-border text-foreground rounded-sm font-semibold text-sm hover:bg-muted transition-colors">
              {mode === "login" ? "Creează un cont nou" : "Am deja cont — Autentifică-te"}
            </button>
          </>
        )}
      </div>

      <Link to="/" className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Înapoi la magazin
      </Link>
    </div>
  );
}
