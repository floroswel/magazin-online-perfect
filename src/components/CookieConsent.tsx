import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CONSENT_ID_KEY = "ml_consent_id";
const CONSENT_PREFS_KEY = "ml_consent_prefs";
const SESSION_KEY = "ml_session_id";

type CookiePrefs = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Global function to reopen cookie settings
(window as any).__openCookieSettings = () => {
  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
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
    const consentId = localStorage.getItem(CONSENT_ID_KEY);
    if (consentId) {
      const savedPrefs = localStorage.getItem(CONSENT_PREFS_KEY);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          window.dispatchEvent(new CustomEvent("gdpr-consent", { detail: { analytics: !!parsed.analytics, marketing: !!parsed.marketing } }));
        } catch {
          localStorage.removeItem(CONSENT_ID_KEY);
          localStorage.removeItem(CONSENT_PREFS_KEY);
          setVisible(true);
        }
      } else {
        setVisible(true);
      }
    } else {
      setVisible(true);
    }

    // Listen for reopen event (from footer link)
    const handleReopen = () => {
      const savedPrefs = localStorage.getItem(CONSENT_PREFS_KEY);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPrefs({ necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing });
        } catch { /* ignore */ }
      }
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-settings", handleReopen);
    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  const saveConsent = async (analytics: boolean, marketing: boolean) => {
    const sessionId = getSessionId();
    localStorage.setItem(CONSENT_PREFS_KEY, JSON.stringify({ analytics, marketing }));
    try {
      const { data } = await supabase.functions.invoke("save-gdpr-consent", {
        body: { session_id: sessionId, analytics, marketing },
      });
      if (data?.consent_id) {
        localStorage.setItem(CONSENT_ID_KEY, data.consent_id);
      }
    } catch {
      localStorage.setItem(CONSENT_ID_KEY, "local");
    }
    window.dispatchEvent(new CustomEvent("gdpr-consent", { detail: { analytics, marketing } }));
    setVisible(false);
  };

  const accept = (all: boolean) => {
    const finalPrefs = all ? { analytics: true, marketing: true } : prefs;
    saveConsent(finalPrefs.analytics, finalPrefs.marketing);
  };

  const reject = () => saveConsent(false, false);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[56px] md:bottom-0 inset-x-0 z-[100] px-3 pb-2">
      <div className="max-w-xl mx-auto bg-card border border-border rounded-lg shadow-xl p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight">🍪 Cookie-uri</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Folosim cookie-uri pentru a îmbunătăți experiența pe site.{" "}
              <Link to="/politica-de-cookies" className="text-primary hover:underline font-medium">Politica de cookies</Link>
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2.5 text-xs border-t pt-3">
                {/* Necessary */}
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked disabled className="accent-primary w-4 h-4 mt-0.5" />
                  <div>
                    <span className="text-foreground font-semibold">Necesare</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Esențiale pentru funcționarea site-ului (autentificare, coș de cumpărături, securitate). Nu pot fi dezactivate.</p>
                  </div>
                </label>

                {/* Analytics */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs(p => ({ ...p, analytics: e.target.checked }))} className="accent-primary w-4 h-4 mt-0.5" />
                  <div>
                    <span className="text-foreground font-semibold">Analitice</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Colectează date anonime despre navigare (Google Analytics, Clarity) pentru îmbunătățirea site-ului.</p>
                  </div>
                </label>

                {/* Marketing */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={prefs.marketing} onChange={(e) => setPrefs(p => ({ ...p, marketing: e.target.checked }))} className="accent-primary w-4 h-4 mt-0.5" />
                  <div>
                    <span className="text-foreground font-semibold">Marketing</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Permit afișarea de reclame personalizate (Meta Pixel, TikTok Pixel) pe baza intereselor tale.</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-3 gap-1"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? "Ascunde setări" : "Personalizează"}
          </Button>

          {/* GDPR: Reject button with EQUAL prominence to Accept */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-4 font-semibold"
            onClick={reject}
          >
            Refuză toate
          </Button>

          {showDetails && (
            <Button
              size="sm"
              variant="secondary"
              className="text-xs h-8 px-4 font-semibold"
              onClick={() => accept(false)}
            >
              Salvează preferințele
            </Button>
          )}

          <Button
            size="sm"
            className="text-xs h-8 px-4 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => accept(true)}
          >
            Acceptă toate
          </Button>
        </div>
      </div>
    </div>
  );
}
