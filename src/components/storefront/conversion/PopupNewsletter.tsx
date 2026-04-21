import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function PopupNewsletter() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const show = settings.popup_show === "true" || settings.popup_show === '"true"';
  const delay = parseInt((settings.popup_delay_seconds || "3").replace(/"/g, ""), 10) * 1000;
  const code = (settings.popup_discount_code || "WELCOME10").replace(/"/g, "");

  useEffect(() => {
    if (!show) return;
    if (localStorage.getItem("popup_shown")) return;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [show, delay]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("popup_shown", "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .upsert({ email, source: "popup" }, { onConflict: "email" });
    setLoading(false);
    if (error) {
      toast.error("Eroare la abonare");
    } else {
      toast.success(`Te-ai abonat! Folosește codul ${code} pentru 10% reducere`);
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white shadow-2xl w-[450px] max-w-[90vw] overflow-hidden" style={{ borderRadius: 8 }}>
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-center text-white">
          <p className="text-2xl font-extrabold">10% REDUCERE</p>
          <p className="text-sm opacity-90 mt-1">LA PRIMA COMANDĂ</p>
        </div>

        <button onClick={handleClose} className="absolute top-3 right-3 text-white/80 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Abonează-te la newsletter și primești cod de reducere <strong className="text-foreground">{code}</strong> pentru prima ta comandă!
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Adresa ta de email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 border text-sm focus:outline-none focus:border-primary"
              style={{ borderColor: "#e5e7eb", borderRadius: 2 }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm uppercase tracking-wide transition-colors disabled:opacity-50"
              style={{ borderRadius: 2 }}
            >
              {loading ? "..." : "VREAU REDUCEREA DE 10%"}
            </button>
          </form>
          <button onClick={handleClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            Nu, mulțumesc.
          </button>
        </div>
      </div>
    </div>
  );
}
