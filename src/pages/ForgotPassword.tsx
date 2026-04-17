import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  usePageSeo({ title: "Ai uitat parola? | Mama Lucica", noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-6 text-3xl font-display font-medium text-foreground tracking-tight">
        Mama Lucica <span className="text-accent">🕯️</span>
      </Link>
      <div className="w-full max-w-md bg-card border border-border rounded-sm shadow-md p-8 text-center">
        {sent ? (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-2xl font-display mb-2">Email trimis</h2>
            <p className="text-sm text-muted-foreground">Verifică inbox-ul (și spam-ul)</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-display text-foreground mb-1">Resetare parolă</h2>
            <p className="text-sm text-muted-foreground mb-6">Introdu email-ul și îți trimitem un link</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required className="w-full h-11 px-3 border border-border rounded-sm text-sm bg-background focus:outline-none focus:border-accent" />
              <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground rounded-sm font-semibold text-sm tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? "Se trimite..." : "Trimite link"}
              </button>
            </form>
          </>
        )}
        <Link to="/auth" className="text-xs text-accent font-semibold hover:underline mt-6 inline-block">← Înapoi la autentificare</Link>
      </div>
    </div>
  );
}
