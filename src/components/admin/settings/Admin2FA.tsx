import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type MfaStatus = "idle" | "loading" | "not_enrolled" | "enrolled" | "enrolling";

export default function Admin2FA() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkEnrollment();
  }, []);

  const checkEnrollment = async () => {
    setStatus("loading");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error("MFA list error:", error);
      setStatus("not_enrolled");
      return;
    }
    const totpFactors = data.totp || [];
    const verified = totpFactors.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStatus("enrolled");
    } else {
      setStatus("not_enrolled");
    }
  };

  const startEnroll = async () => {
    setStatus("enrolling");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Admin TOTP",
    });
    if (error) {
      toast.error("Eroare la inițializare 2FA: " + error.message);
      setStatus("not_enrolled");
      return;
    }
    setQrUrl(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Introdu codul de 6 cifre");
      return;
    }
    setVerifying(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeErr) {
      toast.error("Eroare challenge: " + challengeErr.message);
      setVerifying(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });
    if (verifyErr) {
      toast.error("Cod invalid. Încearcă din nou.");
      setVerifying(false);
      return;
    }
    toast.success("2FA activat cu succes! 🎉");
    setVerifyCode("");
    setQrUrl("");
    setSecret("");
    setStatus("enrolled");
    setVerifying(false);
  };

  const unenroll = async () => {
    setUnenrolling(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error("Eroare la dezactivare: " + error.message);
      setUnenrolling(false);
      return;
    }
    toast.success("2FA dezactivat");
    setStatus("not_enrolled");
    setFactorId("");
    setUnenrolling(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Se verifică starea 2FA...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Autentificare în 2 pași (2FA)
        </CardTitle>
        {status === "enrolled" && (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <ShieldCheck className="w-3 h-3 mr-1" /> Activ
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "enrolled" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Autentificarea în doi pași este activă. Vei avea nevoie de aplicația de autentificare (Google Authenticator, Authy etc.) la fiecare login.
            </p>
            <Button variant="destructive" onClick={unenroll} disabled={unenrolling}>
              {unenrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldOff className="w-4 h-4 mr-2" />}
              Dezactivează 2FA
            </Button>
          </div>
        )}

        {status === "not_enrolled" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Protejează-ți contul de administrator cu autentificare în doi pași. Vei avea nevoie de o aplicație TOTP (Google Authenticator, Authy, 1Password etc.).
            </p>
            <Button onClick={startEnroll}>
              <Shield className="w-4 h-4 mr-2" /> Activează 2FA
            </Button>
          </div>
        )}

        {status === "enrolling" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">1. Scanează codul QR cu aplicația ta de autentificare:</p>
              {qrUrl && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrUrl} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sau introdu manual acest secret:</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1 break-all">{secret}</code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">2. Introdu codul de 6 cifre generat de aplicație:</p>
              <div className="flex gap-2 max-w-xs">
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <Button onClick={verifyEnrollment} disabled={verifying || verifyCode.length !== 6}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifică"}
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setStatus("not_enrolled")}>
              Anulează
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
