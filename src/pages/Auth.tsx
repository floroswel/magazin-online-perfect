import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", fullName: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Autentificare reușită!");
    navigate("/");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(registerForm.email, registerForm.password, registerForm.fullName);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Cont creat! Verifică emailul pentru confirmare.");
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🛒 MegaShop</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Autentificare</TabsTrigger>
                <TabsTrigger value="register">Înregistrare</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div><Label>Email</Label><Input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} required /></div>
                  <div><Label>Parolă</Label><Input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} required /></div>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Ai uitat parola?</Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Se procesează..." : "Intră în cont"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                  <div><Label>Nume complet</Label><Input value={registerForm.fullName} onChange={e => setRegisterForm(p => ({ ...p, fullName: e.target.value }))} required /></div>
                  <div><Label>Email</Label><Input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} required /></div>
                  <div><Label>Parolă</Label><Input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} required /></div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Se procesează..." : "Creează cont"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
