import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "ventuza_cookie_consent";

type CookiePrefs = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = (all: boolean) => {
    const finalPrefs = all
      ? { necessary: true, analytics: true, marketing: true }
      : prefs;
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...finalPrefs, timestamp: Date.now() }));
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">🍪 Acest site folosește cookie-uri</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Folosim cookie-uri pentru a-ți oferi cea mai bună experiență. Poți accepta toate cookie-urile sau să le personalizezi.{" "}
              <Link to="/page/politica-cookie" className="text-primary hover:underline">Politica de cookie-uri</Link>
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked disabled className="accent-primary" />
                  <span className="text-foreground font-medium">Necesare</span>
                  <span className="text-muted-foreground">— esențiale pentru funcționare</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span className="text-foreground font-medium">Analitice</span>
                  <span className="text-muted-foreground">— ne ajută să îmbunătățim site-ul</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs(p => ({ ...p, marketing: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span className="text-foreground font-medium">Marketing</span>
                  <span className="text-muted-foreground">— reclame personalizate</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Ascunde" : "Personalizează"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={reject}>
            Doar necesare
          </Button>
          {showDetails && (
            <Button size="sm" className="text-xs" onClick={() => accept(false)}>
              Salvează preferințele
            </Button>
          )}
          <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => accept(true)}>
            Acceptă toate
          </Button>
        </div>
      </div>
    </div>
  );
}
