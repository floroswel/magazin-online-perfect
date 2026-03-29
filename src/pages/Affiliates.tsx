import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Gift, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePageSeo } from "@/components/SeoHead";

export default function Affiliates() {
  usePageSeo({ title: "Program Afiliere — MamaLucica", description: "Câștigă comision recomandând lumânările MamaLucica.", noindex: true });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [existingAffiliate, setExistingAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", website: "", promotion_plan: "", tax_id: "" });

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from("app_settings").select("value_json").eq("key", "affiliate_config").maybeSingle();
      setSettings(s?.value_json || { enabled: true, default_commission: 10, program_description: "Câștigă comision promovând produsele noastre!" });
      if (user) {
        const { data: aff } = await supabase.from("affiliates").select("*").eq("user_id", user.id).maybeSingle();
        setExistingAffiliate(aff);
        if (!aff) {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
          setForm(f => ({ ...f, full_name: profile?.full_name || "", email: user.email || "" }));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const submit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!form.full_name || !form.email) { toast.error("Completează numele și emailul"); return; }
    setSubmitting(true);
    const code = form.full_name.replace(/\s+/g, "").toUpperCase().slice(0, 6) + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id, affiliate_code: code, status: "pending",
      commission_rate: settings?.default_commission || 10,
      full_name: form.full_name, email: form.email, website: form.website,
      promotion_plan: form.promotion_plan, tax_id: form.tax_id,
    });
    if (error) { toast.error("Eroare la trimitere"); setSubmitting(false); return; }
    toast.success("Cererea ta a fost trimisă! Vei primi un răspuns în curând.");
    const { data: aff } = await supabase.from("affiliates").select("*").eq("user_id", user.id).maybeSingle();
    setExistingAffiliate(aff);
    setSubmitting(false);
  };

  if (loading) return <Layout><div className="container py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></Layout>;

  const benefits = [
    { icon: DollarSign, title: `${settings?.default_commission || 10}% comision`, desc: "Pe fiecare vânzare generată prin linkul tău" },
    { icon: TrendingUp, title: "Dashboard complet", desc: "Urmărește clickuri, conversii și câștiguri în timp real" },
    { icon: Gift, title: "Materiale promoționale", desc: "Bannere și resurse gratuite pentru promovare" },
    { icon: Users, title: "Cod discount unic", desc: "Clienții tăi primesc reducere, tu primești comision" },
  ];

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Program de Afiliere</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{settings?.program_description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {benefits.map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-6 text-center space-y-2">
                <b.icon className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-bold">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {existingAffiliate ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h2 className="text-xl font-bold">
                {existingAffiliate.status === "pending" ? "Cererea ta este în curs de analiză" :
                 existingAffiliate.status === "active" ? "Ești afiliat activ!" :
                 existingAffiliate.status === "rejected" ? "Cererea a fost respinsă" : "Cont suspendat"}
              </h2>
              {existingAffiliate.status === "active" && (
                <Button onClick={() => navigate("/account")}>Mergi la Dashboard Afiliere →</Button>
              )}
              {existingAffiliate.status === "rejected" && existingAffiliate.rejection_reason && (
                <p className="text-sm text-muted-foreground">Motiv: {existingAffiliate.rejection_reason}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Aplică acum</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nume complet *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div><Label>Website / Social Media</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>Cum plănuiești să promovezi?</Label><Textarea value={form.promotion_plan} onChange={e => setForm(f => ({ ...f, promotion_plan: e.target.value }))} rows={3} /></div>
              <div><Label>CNP / CUI (pentru facturare)</Label><Input value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} /></div>
              <Button className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se trimite...</> : "Trimite cererea"}
              </Button>
              {!user && <p className="text-xs text-center text-muted-foreground">Trebuie să fii autentificat pentru a aplica. <a href="/auth" className="text-primary underline">Autentifică-te</a></p>}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
