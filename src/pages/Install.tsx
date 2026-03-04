import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Check, Share } from "lucide-react";

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Aplicația este instalată!</h1>
          <p className="text-muted-foreground">Poți accesa magazinul direct de pe ecranul principal.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Smartphone className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Instalează MegaShop</h1>
          <p className="text-muted-foreground">
            Accesează magazinul direct de pe telefonul tău, fără a descărca din App Store.
          </p>
        </div>

        {deferredPrompt && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Button size="lg" onClick={handleInstall} className="gap-2 font-semibold">
                <Download className="w-5 h-5" />
                Instalează aplicația
              </Button>
            </CardContent>
          </Card>
        )}

        {isIOS && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg">Instalare pe iPhone / iPad:</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <p className="text-sm">Apasă pe butonul <Share className="inline w-4 h-4" /> <strong>Share</strong> din bara Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <p className="text-sm">Selectează <strong>„Add to Home Screen"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <p className="text-sm">Apasă <strong>„Add"</strong> — Gata!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isIOS && !deferredPrompt && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Deschide meniul browser-ului (⋮) și selectează <strong>„Install app"</strong> sau <strong>„Add to Home Screen"</strong>.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Funcționează offline", icon: "📶" },
            { label: "Rapid ca o aplicație", icon: "⚡" },
            { label: "Fără App Store", icon: "🎯" },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="text-xs text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
