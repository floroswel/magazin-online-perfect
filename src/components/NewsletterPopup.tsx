import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Mail, Gift } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    popup_enabled: false, popup_delay: 5, popup_title: "Abonează-te!",
    popup_subtitle: "Primește oferte exclusive pe email.", popup_offer: "10% reducere la prima comandă",
    popup_max_dismissals: 3,
  });

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "newsletter_settings").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          const s = data.value_json as any;
          setSettings(prev => ({ ...prev, ...s }));
          if (!s.popup_enabled) return;

          // Check dismissals
          const dismissals = Number(localStorage.getItem("newsletter_popup_dismissals") || 0);
          if (dismissals >= (s.popup_max_dismissals || 3)) return;
          // Check if already subscribed
          if (localStorage.getItem("newsletter_subscribed")) return;

          setTimeout(() => setVisible(true), (s.popup_delay || 5) * 1000);
        }
      });
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (!settings.popup_enabled) return;
    const dismissals = Number(localStorage.getItem("newsletter_popup_dismissals") || 0);
    if (dismissals >= settings.popup_max_dismissals) return;
    if (localStorage.getItem("newsletter_subscribed")) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) setVisible(true);
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [settings]);

  const handleClose = () => {
    const d = Number(localStorage.getItem("newsletter_popup_dismissals") || 0) + 1;
    localStorage.setItem("newsletter_popup_dismissals", String(d));
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { toast.error("Trebuie să accepți primirea emailurilor promoționale."); return; }
    const result = emailSchema.safeParse(email);
    if (!result.success) { toast.error("Adresă email invalidă"); return; }

    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email: result.data, source: "popup", consent_at: new Date().toISOString(), consent_ip: "" } as any,
      { onConflict: "email" }
    );

    if (error && error.code !== "23505") {
      toast.error("Eroare la abonare");
    } else {
      toast.success("Te-ai abonat cu succes! 🎉");
      localStorage.setItem("newsletter_subscribed", "1");
      setVisible(false);
    }
    setLoading(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden">
        <button onClick={handleClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-primary/5 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{settings.popup_title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{settings.popup_subtitle}</p>
          {settings.popup_offer && (
            <div className="mt-3 inline-block bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full">
              {settings.popup_offer}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresa ta de email" className="pl-10" type="email" required />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="popup-consent" checked={consent} onCheckedChange={v => setConsent(!!v)} className="mt-0.5" />
            <label htmlFor="popup-consent" className="text-xs text-muted-foreground cursor-pointer">
              Sunt de acord să primesc emailuri promoționale. Citește <Link to="/page/politica-de-confidentialitate" className="text-primary hover:underline">Politica de Confidențialitate</Link>. Mă pot dezabona oricând.
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Se procesează..." : "Abonează-te"}
          </Button>
        </form>
      </div>
    </div>
  );
}
