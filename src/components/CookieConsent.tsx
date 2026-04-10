import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
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
      // Load consent preferences from localStorage (DB read restricted by RLS)
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
        // Legacy: consent_id exists but no prefs stored, show banner again
        setVisible(true);
      }
    } else {
      setVisible(true);
    }
  }, []);

  const saveConsent = async (analytics: boolean, marketing: boolean) => {
    const sessionId = getSessionId();
    // Save preferences in localStorage for quick access
    localStorage.setItem(CONSENT_PREFS_KEY, JSON.stringify({ analytics, marketing }));
    try {
      const { data } = await supabase.functions.invoke("save-gdpr-consent", {
        body: { session_id: sessionId, analytics, marketing },
      });
      if (data?.consent_id) {
        localStorage.setItem(CONSENT_ID_KEY, data.consent_id);
      }
    } catch {
      // Fallback: store minimal flag
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
      <div className="max-w-xl mx-auto bg-card border border-border rounded-lg shadow-xl p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-xs leading-tight">🍪 Cookie-uri</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Folosim cookie-uri pentru experiența optimă.{" "}
              <Link to="/politica-de-cookies" className="text-primary hover:underline">Detalii</Link>
            </p>

            {showDetails && (
              <div className="mt-2 space-y-1 text-[11px]">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked disabled className="accent-primary w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">Necesare</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs(p => ({ ...p, analytics: e.target.checked }))} className="accent-primary w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">Analitice</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={prefs.marketing} onChange={(e) => setPrefs(p => ({ ...p, marketing: e.target.checked }))} className="accent-primary w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">Marketing</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-end flex-wrap">
          <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Ascunde" : "Setări"}
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={reject}>
            Necesare
          </Button>
          {showDetails && (
            <Button size="sm" className="text-[11px] h-7 px-2" onClick={() => accept(false)}>
              Salvează
            </Button>
          )}
          <Button size="sm" className="text-[11px] h-7 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => accept(true)}>
            Acceptă toate
          </Button>
        </div>
      </div>
    </div>
  );
}
