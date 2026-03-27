import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Gift } from "lucide-react";
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
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h2 className="font-serif text-2xl font-bold mb-2">Mulțumim!</h2>
          <p className="text-primary-foreground/80">Codul tău <span className="font-bold tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">VENTUZA10</span> a fost trimis pe email.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary text-primary-foreground py-14 md:py-20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      
      <div className="container relative px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Gift className="h-7 w-7 text-accent" />
          </div>
          <h2 className="font-serif text-2xl md:text-4xl font-extrabold mb-3">-10% la Prima Comandă</h2>
          <p className="text-sm md:text-base text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Înscrie-te la newsletter și primești codul de reducere instant pe email
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Adresa ta de email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white text-foreground border-0 rounded-lg h-12"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-8 h-12 text-sm font-bold shadow-lg">
              Vreau -10%
            </Button>
          </form>
          <p className="text-[11px] text-primary-foreground/50 mt-4 tracking-wide">Fără spam. Dezabonare oricând.</p>
        </div>
      </div>
    </section>
  );
}
