import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MailX, CheckCircle } from "lucide-react";
import { usePageSeo } from "@/components/SeoHead";

export default function Unsubscribe() {
  usePageSeo({ title: "Dezabonare Newsletter — MamaLucica", description: "Gestionează preferințele de email.", noindex: true });
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [confirmed, setConfirmed] = useState(false);
  const [partial, setPartial] = useState(false);
  const [keepTransactional, setKeepTransactional] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    if (email) {
      await supabase.from("newsletter_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() } as any)
        .eq("email", email);
    }
    setConfirmed(true);
    setProcessing(false);
  };

  if (confirmed) {
    return (
      <Layout>
        <div className="container py-16 max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Te-ai dezabonat</h1>
          <p className="text-muted-foreground">
            Nu vei mai primi emailuri promoționale. Emailurile tranzacționale (confirmare comandă, livrare) vor continua să fie trimise.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-16 max-w-md mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <MailX className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Confirmare dezabonare</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ești sigur că vrei să te dezabonezi de la emailurile promoționale?
              {email && <><br /><strong>{email}</strong></>}
            </p>

            <div className="text-left space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Checkbox id="keep-transactional" checked={keepTransactional} onCheckedChange={v => setKeepTransactional(!!v)} className="mt-0.5" />
                <label htmlFor="keep-transactional" className="text-xs text-muted-foreground cursor-pointer">
                  Continuă să trimite emailuri tranzacționale (confirmare comandă, update livrare)
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="destructive" onClick={handleUnsubscribe} disabled={processing}>
                {processing ? "Se procesează..." : "Dezabonează-mă"}
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>Anulează</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
