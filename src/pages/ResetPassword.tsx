import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { usePageSeo } from "@/components/SeoHead";

export default function ResetPassword() {
  usePageSeo({ title: "Parolă Nouă — MamaLucica", description: "Setează o parolă nouă pentru contul tău.", noindex: true });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user arrived via recovery link (Supabase sets session automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    // Also check current session — user might already be in recovery state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        // Give a moment for the auth state change to fire
        setTimeout(() => {
          setIsValidSession((prev) => (prev === null ? false : prev));
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Parola trebuie să aibă cel puțin 6 caractere.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Parolele nu se potrivesc.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        toast.error("Linkul a expirat. Te rugăm să soliciți un nou link de resetare.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Parola a fost schimbată cu succes!");
    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isValidSession === null) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isValidSession === false) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-destructive">Link invalid sau expirat</CardTitle>
              <CardDescription>
                Linkul de resetare a expirat sau este invalid. Te rugăm să soliciți un nou link.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/forgot-password")} className="w-full">
                Solicită un nou link
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Setează parola nouă</CardTitle>
            <CardDescription>Introdu noua parolă pentru contul tău.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Parolă nouă</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minim 6 caractere"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmă parola</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repetă parola"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Se salvează..." : "Salvează parola nouă"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
