import { useState } from "react";
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
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="adresa@email.ro"
          className="flex-1 h-11 px-3 rounded-md bg-black/10 border border-black/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:border-black"
        />
        <button
          type="submit" disabled={loading || !consent || !email}
          className="px-5 h-11 rounded-md font-bold text-sm bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/80 transition-opacity"
        >
          {loading ? "..." : "Abonează"}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-black/80 cursor-pointer leading-snug">
        <input
          type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-black shrink-0"
        />
        <span>Sunt de acord cu prelucrarea datelor conform <a href="/page/politica-de-confidentialitate" className="underline">Politicii de Confidențialitate</a> (GDPR).</span>
      </label>
    </form>
  );
}
