import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const KEY = "ml_cookie_consent_v2";

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch { /* ignore */ }
  }, []);

  const save = (c: Consent) => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...c, savedAt: new Date().toISOString() })); } catch { /* ignore */ }
    setShow(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => save({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => save({ necessary: true, analytics, marketing });

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md">
      <div className="bg-card border border-border shadow-editorial rounded-sm m-2 lg:m-0 p-5">
        <div className="flex items-start gap-3 mb-3">
          <Cookie className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-lg text-foreground mb-1">Cookies & confidențialitate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Folosim cookie-uri pentru funcționalitate și analiză. Citește{" "}
              <Link to="/page/politica-cookie" className="text-accent underline">Politica Cookie</Link>.
            </p>
          </div>
        </div>

        {details && (
          <div className="space-y-2 my-3 border-t border-border pt-3">
            <label className="flex items-center justify-between text-xs">
              <span><strong>Necesare</strong> · obligatorii</span>
              <input type="checkbox" checked disabled className="accent-accent" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span><strong>Analitice</strong> · ne ajută să îmbunătățim</span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="accent-accent" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span><strong>Marketing</strong> · oferte personalizate</span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="accent-accent" />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={acceptAll} className="flex-1 min-w-[8rem] h-9 bg-primary text-primary-foreground rounded-sm text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity">
            Accept toate
          </button>
          {!details ? (
            <button onClick={() => setDetails(true)} className="flex-1 min-w-[8rem] h-9 border border-border text-foreground rounded-sm text-xs font-semibold hover:bg-muted transition-colors">
              Setări
            </button>
          ) : (
            <button onClick={saveCustom} className="flex-1 min-w-[8rem] h-9 border border-border text-foreground rounded-sm text-xs font-semibold hover:bg-muted transition-colors">
              Salvează alegerile
            </button>
          )}
          <button onClick={rejectAll} className="text-xs text-muted-foreground underline hover:text-foreground self-center">
            Refuză opționale
          </button>
        </div>
      </div>
    </div>
  );
}
