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
    else { toast.success("Codul VENTUZA10 a fost trimis pe email!"); setDone(true); }
    setLoading(false);
  };

  if (done) {
    return (
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-serif text-2xl text-primary-foreground mb-2">Mulțumim!</h2>
          <p className="text-primary-foreground/80 font-sans text-sm">
            Codul tău <span className="font-medium tracking-wider bg-accent-foreground/10 text-primary-foreground px-3 py-1 rounded-full text-sm">VENTUZA10</span> a fost trimis pe email.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary py-16 md:py-20" ref={ref}>
      <div className="container px-4">
        <div className="max-w-xl mx-auto text-center reveal stagger-1">
          <h2 className="font-serif text-2xl md:text-4xl text-primary-foreground mb-3">
            10% reducere la prima ta comandă
          </h2>
          <p className="font-sans font-light text-sm text-primary-foreground/70 mb-8">
            Abonează-te pentru oferte exclusive și noutăți
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <Input
              type="email"
              placeholder="Adresa ta de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-primary-foreground text-foreground border-0 rounded-full h-12 px-5 font-sans text-sm input-glow"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-cta bg-ventuza-dark text-[#FAF6F0] font-sans font-medium text-sm px-8 h-12 rounded-full hover:bg-ventuza-dark-surface transition-colors disabled:opacity-50"
            >
              Abonează-te
            </button>
          </form>
          <p className="font-sans text-[11px] text-primary-foreground/40 mt-4">Fără spam. Dezabonare oricând.</p>
        </div>
      </div>
    </section>
  );
}
