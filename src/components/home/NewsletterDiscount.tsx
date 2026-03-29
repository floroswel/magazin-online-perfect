import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
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
      <section className="py-16">
        <div className="container text-center">
          <h2 className="font-serif text-2xl text-foreground mb-2">Mulțumim!</h2>
          <p className="text-muted-foreground font-sans text-sm">
            Codul tău <span className="font-semibold">MAMALUCICA10</span> a fost trimis pe email.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20" ref={ref}>
      <div className="container px-4">
        <div className="max-w-md mx-auto reveal stagger-1">
          <p className="font-sans text-sm text-muted-foreground mb-4 text-center md:text-left">
            Abonează-te pentru noutăți și oferte!
          </p>
          <form onSubmit={handleSubmit} className="flex">
            <Input
              type="email"
              placeholder="Adresa de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background text-foreground border border-foreground rounded-none h-12 px-5 font-sans text-sm focus:ring-0 focus:border-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 bg-foreground text-background h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
