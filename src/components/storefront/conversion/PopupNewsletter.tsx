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
      <div className="relative bg-white rounded-lg shadow-2xl w-[450px] max-w-[90vw] overflow-hidden">
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 z-10 text-2xl leading-none">
          <X className="w-5 h-5" />
        </button>

        {/* Header grafic cu clip-path */}
        <div className="h-[140px] flex items-center justify-center relative" style={{ background: `linear-gradient(to right, var(--btn-primary-bg, #141414), #000)` }}>
          <div className="text-center text-white">
            <p className="text-3xl font-bold">10% REDUCERE</p>
            <p className="text-sm font-medium opacity-90">LA PRIMA COMANDĂ</p>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-6 bg-white"
            style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
          />
        </div>

        {/* Formular */}
        <div className="p-8 pt-10 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Fii primul care află!</h3>
          <p className="text-sm text-gray-500 mb-4">
            Abonează-te și primești un cod de 10% reducere + acces la vânzări private.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Adresa ta de email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-sm px-4 py-3 text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold text-sm py-3 rounded-sm transition-colors tracking-wide disabled:opacity-50"
              style={{ background: "var(--btn-primary-bg, #141414)", color: "var(--btn-primary-text, #fff)" }}
            >
              {loading ? "Se procesează..." : "VREAU REDUCEREA DE 10%"}
            </button>
          </form>
          <button
            onClick={handleClose}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Nu, mulțumesc.
          </button>
        </div>
      </div>
    </div>
  );
}
