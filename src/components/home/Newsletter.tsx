import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [gdprOk, setGdprOk] = useState(false);
  const { settings } = useSettings();

  const title = settings.newsletter_title || "Abonează-te și primești 10% reducere";
  const subtitle = settings.newsletter_subtitle || "Fii primul care află despre oferte exclusive și produse noi";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers" as any).insert({ email });
    setLoading(false);
    if (error && error.code !== "23505") {
      toast.error("Eroare la abonare");
    } else {
      setDone(true);
      toast.success("Te-ai abonat cu succes!");
    }
  };

  return (
    <section className="py-12" style={{ background: settings.newsletter_bg || undefined, backgroundColor: settings.newsletter_bg ? undefined : "hsl(var(--lumax-blue-light, 217 100% 95%))" }}>
      <div className="lumax-container flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="md:w-[60%]">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-2">{title}</h2>
          <p className="text-[15px] text-muted-foreground mb-3">{subtitle}</p>
          <p className="text-xs text-muted-foreground/70">
            ✅ Peste 5000 abonați · ✅ Fără spam · ✅ Dezabonare oricând
          </p>
        </div>
        <div className="md:w-[40%] w-full">
          {done ? (
            <p className="text-lumax-green font-bold text-center">✅ Te-ai abonat! Verifică emailul.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresa ta de email"
                className="w-full h-[46px] border-2 border-primary rounded-md px-4 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[46px] bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-lumax-blue-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Se trimite..." : "Abonează-te Acum →"}
              </button>
              <p className="text-[11px] text-muted-foreground/60">
                Prin abonare ești de acord cu Politica de Confidențialitate
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
