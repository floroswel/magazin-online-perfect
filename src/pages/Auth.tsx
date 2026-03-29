import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { usePageSeo } from "@/components/SeoHead";

export default function Auth() {
  usePageSeo({ title: "Autentificare — MamaLucica", description: "Conectează-te sau creează un cont MamaLucica.", noindex: true });
  const { signIn, signUp } = useAuth();
  const branding = useStoreBranding();
  const navigate = useNavigate();
  const { subscribe: subscribePush, isSupported: pushSupported } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", fullName: "" });
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Autentificare reușită!");
    if (pushSupported) subscribePush();
    navigate("/");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent) { toast.error("Trebuie să accepți Termenii și Politica de Confidențialitate."); return; }
    setLoading(true);
    const { error } = await signUp(registerForm.email, registerForm.password, registerForm.fullName);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Cont creat! Verifică emailul pentru confirmare.");
    if (pushSupported) subscribePush();
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        const msg = result.error.message || "Eroare la autentificarea cu Google.";
        if (msg.toLowerCase().includes("popup")) {
          toast.error("Fereastra popup a fost blocată. Permite popup-urile și încearcă din nou.");
        } else if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
          toast.error("Există deja un cont cu acest email. Folosește parola pentru autentificare.");
        } else {
          toast.error(msg);
        }
        setGoogleLoading(false);
        return;
      }

      // If redirected, the page will reload with the session
      if (!result.redirected) {
        toast.success("Autentificare reușită!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err?.message || "Eroare la autentificarea cu Google.");
      setGoogleLoading(false);
    }
  };

  const GoogleButton = ({ disabled }: { disabled: boolean }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center gap-3 h-11"
      onClick={handleGoogleLogin}
      disabled={disabled || googleLoading}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {googleLoading ? "Se procesează..." : "Continuă cu Google"}
    </Button>
  );

  return (
    <Layout>
      <div className="container py-20 flex justify-center">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center pb-2">
            <p className="font-serif text-3xl font-medium tracking-wide text-foreground">MamaLucica</p>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1">Contul tău</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Autentificare</TabsTrigger>
                <TabsTrigger value="register">Înregistrare</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <div className="space-y-4 pt-4">
                  <GoogleButton disabled={loading} />
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">sau</span>
                    <Separator className="flex-1" />
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div><Label>Email</Label><Input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} required /></div>
                    <div><Label>Parolă</Label><Input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} required /></div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">Ai uitat parola?</Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? "Se procesează..." : "Intră în cont"}</Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <div className="space-y-4 pt-4">
                  <GoogleButton disabled={loading} />
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">sau</span>
                    <Separator className="flex-1" />
                  </div>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div><Label>Nume complet</Label><Input value={registerForm.fullName} onChange={e => setRegisterForm(p => ({ ...p, fullName: e.target.value }))} required /></div>
                    <div><Label>Email</Label><Input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} required /></div>
                    <div><Label>Parolă</Label><Input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} required minLength={6} /></div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-1 rounded" />
                      <span className="text-xs text-muted-foreground">
                        Sunt de acord cu <Link to="/page/termeni-si-conditii" className="text-primary hover:underline" target="_blank">Termenii și Condițiile</Link> și <Link to="/page/politica-de-confidentialitate" className="text-primary hover:underline" target="_blank">Politica de Confidențialitate</Link>.
                      </span>
                    </label>
                    <Button type="submit" className="w-full" disabled={loading || !gdprConsent}>{loading ? "Se procesează..." : "Creează cont"}</Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
