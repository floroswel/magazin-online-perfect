import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function NewsletterDiscount() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useScrollReveal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Adresa de email nu este validă");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim(), source: "homepage_discount", consent_at: new Date().toISOString() } as any);
    if (error?.code === "23505") toast.info("Ești deja abonat!");
    else if (error) toast.error("Eroare la abonare");
    else { toast.success("Codul MAMALUCICA10 a fost trimis pe email!"); setDone(true); }
    setLoading(false);
  };

  if (done) {
    return (
      <section className="bg-ml-warm-bg py-16">
        <div className="container text-center">
          <h2 className="font-serif text-2xl text-foreground mb-2">Mulțumim!</h2>
          <p className="text-muted-foreground font-sans text-sm">
            Codul tău <span className="font-semibold tracking-wider bg-primary/10 text-primary px-3 py-1 text-sm">MAMALUCICA10</span> a fost trimis pe email.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ml-warm-bg py-16 md:py-20" ref={ref}>
      <div className="container px-4">
        <div className="max-w-xl mx-auto text-center reveal stagger-1">
          <h2 className="font-serif text-2xl md:text-4xl text-foreground mb-3">
            Abonează-te și primești 10% reducere
          </h2>
          <p className="font-sans font-light text-sm text-muted-foreground mb-8">
            Fii prima care află despre noutăți și oferte exclusive
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-0">
            <Input
              type="email"
              placeholder="Adresa ta de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background text-foreground border border-border rounded-none h-12 px-5 font-sans text-sm input-glow"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-cta bg-foreground text-background font-sans font-medium text-sm px-8 h-12 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Abonează-te
            </button>
          </form>
          <p className="font-sans text-[11px] text-muted-foreground mt-4">Fără spam. Dezabonare oricând.</p>
        </div>
      </div>
    </section>
  );
}
