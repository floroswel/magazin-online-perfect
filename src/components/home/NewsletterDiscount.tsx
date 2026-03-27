import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function NewsletterDiscount() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
    if (error?.code === "23505") {
      toast.info("Ești deja abonat!");
    } else if (error) {
      toast.error("Eroare la abonare");
    } else {
      toast.success("Codul VENTUZA10 a fost trimis pe email!");
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <section className="bg-secondary text-secondary-foreground py-16">
        <div className="container text-center">
          <h2 className="font-serif text-2xl font-medium mb-2">Mulțumim!</h2>
          <p className="text-secondary-foreground/60">Codul tău <span className="font-medium text-ventuza-gold tracking-wider">VENTUZA10</span> a fost trimis pe email.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-secondary text-secondary-foreground py-12 md:py-20">
      <div className="container max-w-lg text-center px-5">
        <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-3 md:mb-4 font-medium">Ofertă Exclusivă</p>
        <h2 className="font-serif text-2xl md:text-3xl font-medium mb-2 md:mb-3">-10% la Prima Comandă</h2>
        <p className="text-sm md:text-base text-secondary-foreground/60 mb-6 md:mb-8">
          Înscrie-te la newsletter și primești codul de reducere instant
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-sm mx-auto gap-2 sm:gap-0">
          <Input
            type="email"
            placeholder="Adresa ta de email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/30 rounded-none"
            required
          />
          <Button type="submit" disabled={loading} className="bg-ventuza-gold hover:bg-ventuza-gold-light text-secondary rounded-none px-6 text-xs tracking-wide uppercase font-medium">
            Vreau -10%
          </Button>
        </form>
        <p className="text-[11px] text-secondary-foreground/30 mt-4 tracking-wide">Fără spam. Dezabonare oricând.</p>
      </div>
    </section>
  );
}
