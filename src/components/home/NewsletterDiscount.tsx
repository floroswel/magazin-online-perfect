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
      toast.success("Codul tău de reducere VENTUZA10 a fost trimis pe email! 🎉");
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <section className="bg-primary/10 py-10">
        <div className="container text-center">
          <p className="text-xl font-bold text-foreground">🎉 Felicitări!</p>
          <p className="text-muted-foreground mt-1">Codul tău <span className="font-mono font-bold text-primary">VENTUZA10</span> a fost trimis pe email.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary/10 py-10">
      <div className="container max-w-lg text-center">
        <h2 className="text-2xl font-bold text-foreground">🎁 -10% la Prima Comandă</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          Înscrie-te și primești codul de reducere instant + noutăți despre parfumuri noi și oferte exclusive
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Adresa ta de email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={loading} className="font-semibold">
            Vreau -10%
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">Fără spam. Dezabonare oricând.</p>
      </div>
    </section>
  );
}
