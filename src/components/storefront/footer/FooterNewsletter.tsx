import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function FooterNewsletter() {
  const { toast } = useToast();
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
      toast({ title: "Te-ai abonat!", description: "Mulțumim! Verifică emailul pentru confirmare." });
      setEmail(""); setConsent(false);
    } catch (err: any) {
      toast({ title: "Eroare", description: err.message || "Încearcă din nou.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5" style={{ color: "hsl(var(--footer-accent))" }} />
        <h4 className="text-base font-semibold text-white">Înscrie-te la newsletter</h4>
      </div>
      <p className="text-xs text-white/60 mb-4">
        Primești 10% reducere la prima comandă și acces anticipat la lansări.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="adresa@email.ro"
            className="flex-1 h-10 px-3 rounded-md bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[hsl(var(--footer-accent))]"
          />
          <button
            type="submit" disabled={loading || !consent || !email}
            className="px-4 h-10 rounded-md font-semibold text-sm text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "hsl(var(--footer-accent))" }}
          >
            {loading ? "..." : "Abonează"}
          </button>
        </div>
        <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer leading-snug">
          <input
            type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[hsl(var(--footer-accent))] shrink-0"
          />
          <span>Sunt de acord cu prelucrarea datelor conform <a href="/page/politica-de-confidentialitate" className="underline">Politicii de Confidențialitate</a> (GDPR).</span>
        </label>
      </form>
    </div>
  );
}
