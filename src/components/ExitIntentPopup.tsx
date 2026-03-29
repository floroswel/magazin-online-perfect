import { useState, useEffect, useCallback } from "react";
import { X, Clock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [code] = useState(() => "EXIT" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 5 && !show) {
      const dismissed = sessionStorage.getItem("exit_popup_dismissed");
      if (dismissed) return;
      setShow(true);
    }
  }, [show]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 10000); // Wait 10s before activating

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  // Countdown timer
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev === 0) {
          setMinutes(m => {
            if (m === 0) { clearInterval(interval); return 0; }
            return m - 1;
          });
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("exit_popup_dismissed", "1");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    toast.success("Cod copiat! Folosește-l la checkout.");
    setTimeout(() => setCopied(false), 3000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-[90%] overflow-hidden">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />

        <div className="p-6 md:p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Stai! Nu pleca fără cadou 🎁
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Primești <span className="font-bold text-primary text-lg">10% REDUCERE</span> la prima ta comandă. Ofertă valabilă doar acum!
          </p>

          {/* Coupon code */}
          <div className="bg-muted/50 border-2 border-dashed border-primary/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Codul tău de reducere</p>
            <code className="text-2xl font-mono font-extrabold tracking-[0.15em] text-primary">{code}</code>
          </div>

          <Button onClick={handleCopy} className="w-full mb-4 font-semibold" size="lg">
            {copied ? "✓ Copiat!" : "Copiază codul și cumpără acum"}
          </Button>

          {/* Timer */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Expiră în <strong className="text-foreground">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong></span>
          </div>

          <button
            onClick={handleDismiss}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Nu, mulțumesc
          </button>
        </div>
      </div>
    </div>
  );
}
