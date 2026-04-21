import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers" as any).insert({
        email: email.toLowerCase().trim(),
        consent_given: true,
        source: "footer",
      });
      if (error && !String(error.message).includes("duplicate")) throw error;
      toast.success("Te-ai abonat! Verifică emailul pentru confirmare.");
      setEmail(""); setConsent(false);
    } catch (err: any) {
      toast.error(err.message || "Încearcă din nou.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="adresa@email.ro"
          className="flex-1 h-11 px-3 bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary"
          style={{ borderRadius: 2 }}
        />
        <button
          type="submit" disabled={loading || !consent || !email}
          className="px-5 h-11 font-bold text-sm bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          style={{ borderRadius: 2 }}
        >
          {loading ? "..." : "Abonează"}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-white/60 cursor-pointer leading-snug">
        <input
          type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary shrink-0"
        />
        <span>Sunt de acord cu prelucrarea datelor conform <a href="/page/politica-de-confidentialitate" className="underline hover:text-white">Politicii de Confidențialitate</a>.</span>
      </label>
    </form>
  );
}
