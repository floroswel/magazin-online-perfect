import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const emailSchema = z.string().trim().email("Adresa de email nu este validă").max(255);

export default function NewsletterDiscount() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useScrollReveal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: result.data, source: "homepage_banner", consent_at: new Date().toISOString() } as any);
    if (error) toast[error.code === "23505" ? "info" : "error"](error.code === "23505" ? "Ești deja abonat!" : "Eroare.");
    else { toast.success("Te-ai abonat cu succes! Verifică inbox-ul."); setEmail(""); }
    setLoading(false);
  };

  return (
    <section className="bg-primary" ref={ref}>
      <div className="container py-8 md:py-12 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 reveal stagger-1">
          <div className="flex items-center gap-4 text-primary-foreground">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">Abonează-te la Newsletter</h3>
              <p className="text-primary-foreground/80 text-sm">Primești 10% reducere la prima comandă + oferte exclusive!</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresa ta de email"
              className="flex-1 md:w-72 h-11 px-4 text-sm bg-primary-foreground text-foreground rounded-l-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-5 bg-accent text-accent-foreground font-bold text-sm rounded-r-lg hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Abonează-te <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
