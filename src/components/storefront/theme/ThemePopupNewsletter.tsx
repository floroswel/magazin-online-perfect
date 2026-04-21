import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ThemePopupNewsletter() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const show = settings.popup_show === "true";
  const delay = parseInt(settings.popup_delay_seconds || "3", 10) * 1000;
  const code = settings.popup_discount_code || "WELCOME10";
  const percent = settings.popup_discount_percent || "10";

  useEffect(() => {
    if (!show) return;
    const dismissed = sessionStorage.getItem("popup_newsletter_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [show, delay]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("popup_newsletter_dismissed", "1");
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
      toast.success(`Te-ai abonat! Folosește codul ${code} pentru ${percent}% reducere`);
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <button onClick={handleClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-foreground">🎉 Reducere {percent}%</h3>
          <p className="text-muted-foreground">
            Abonează-te la newsletter și primești cod de reducere <strong>{code}</strong> pentru prima comandă!
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Adresa ta de email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Abonează-te"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
