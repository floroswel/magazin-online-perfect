import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  usePageSeo({ title: "Ai uitat parola? | LUMAX", noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setSent(true);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="lumax-container py-12 max-w-md mx-auto">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h1 className="text-2xl font-extrabold text-primary mb-1">LUMAX</h1>
          {sent ? (
            <>
              <p className="text-5xl my-4">✅</p>
              <h2 className="text-lg font-bold mb-2">Email trimis!</h2>
              <p className="text-sm text-muted-foreground">Verifică inbox-ul (și spam-ul)</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mt-2 mb-1">Ai uitat parola?</h2>
              <p className="text-sm text-muted-foreground mb-6">Introdu email-ul și îți trimitem un link de resetare</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background focus:ring-primary focus:border-primary" />
                <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-lumax-blue-dark disabled:opacity-50">
                  {loading ? "Se trimite..." : "Trimite link"}
                </button>
              </form>
            </>
          )}
          <Link to="/auth" className="text-xs text-primary font-semibold hover:underline mt-4 inline-block">← Înapoi la autentificare</Link>
        </div>
      </div>
    </Layout>
  );
}