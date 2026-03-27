import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Users, Building2, PartyPopper, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const eventTypes = [
  { icon: Heart, label: "Nuntă", desc: "Lumânări personalizate cu numele mirilor și data evenimentului" },
  { icon: Users, label: "Botez", desc: "Lumânări de botez cu numele copilului, ambalaj special" },
  { icon: Building2, label: "Corporate", desc: "Lumânări cu logo-ul firmei pentru cadouri corporate sau teambuilding" },
  { icon: PartyPopper, label: "Aniversare", desc: "Seturi cadou personalizate cu mesaj special" },
];

const processSteps = [
  { step: "1", title: "Comandă", desc: "Completezi formularul cu detaliile evenimentului" },
  { step: "2", title: "Confirmare", desc: "Te contactăm în 24h cu oferta personalizată" },
  { step: "3", title: "Producție", desc: "Realizăm lumânările în atelierul nostru (5-10 zile)" },
  { step: "4", title: "Livrare", desc: "Livrăm la adresa evenimentului sau unde dorești" },
];

export default function ComenziEvenimente() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", event_type: "", quantity: "", date: "", details: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Cererea ta a fost trimisă! Te vom contacta în 24 de ore.");
    setSent(true);
  };

  return (
    <Layout>
      <SeoHead title="Lumânări pentru Evenimente — Nuntă, Botez, Corporate | VENTUZA" description="Comandă lumânări personalizate pentru evenimente: nunți, botezuri, aniversări, corporate. Cantități mari, design personalizat. VENTUZA." />
      <div className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lumânări pentru Evenimente Speciale</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Adaugă un element memorabil evenimentelor tale cu lumânări VENTUZA personalizate. Comandă minimă: 10 bucăți.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {eventTypes.map((et, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <et.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{et.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{et.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Personalizare Logo</h3>
              <p className="text-xs text-muted-foreground">Etichetă cu logo-ul tău sau textul dorit</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Cantități Mari</h3>
              <p className="text-xs text-muted-foreground">De la 10 buc, cu discount progresiv</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Termene Flexibile</h3>
              <p className="text-xs text-muted-foreground">Producție 5-10 zile, urgențe disponibile</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {processSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-3">
                <span className="text-primary font-bold text-lg">{s.step}</span>
                <div>
                  <p className="font-semibold text-xs">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground hidden md:block">{s.desc}</p>
                </div>
              </div>
              {i < processSteps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />}
            </div>
          ))}
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Solicită Ofertă</h2>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold">Cererea ta a fost trimisă!</p>
                <p className="text-sm text-muted-foreground mt-1">Te vom contacta în maximum 24 de ore cu oferta personalizată.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nume complet</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Telefon</Label><Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div>
                    <Label>Tip eveniment</Label>
                    <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Alege..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nunta">Nuntă</SelectItem>
                        <SelectItem value="botez">Botez</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="aniversare">Aniversare</SelectItem>
                        <SelectItem value="altul">Altul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cantitate estimată</Label><Input type="number" min="10" placeholder="min. 10 buc" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                  <div><Label>Data evenimentului</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                </div>
                <div><Label>Detalii suplimentare</Label><Textarea placeholder="Descrie ce ai în minte: parfum, culoare, text, ambalaj..." value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></div>
                <Button type="submit" className="w-full">Trimite Cererea</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
