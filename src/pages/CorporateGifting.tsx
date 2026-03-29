import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function CorporateGifting() {
  const [form, setForm] = useState({
    company_name: "", contact_person: "", email: "", phone: "",
    units_needed: 10, personalization_details: "", desired_delivery_date: "",
    budget_range: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.email || !form.phone) {
      toast.error("Completează toate câmpurile obligatorii");
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).from("corporate_gift_requests").insert(form);
    if (error) {
      toast.error("Eroare la trimitere. Încearcă din nou.");
    } else {
      setSubmitted(true);
      toast.success("Cererea a fost trimisă cu succes!");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container py-16 text-center max-w-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-foreground">Mulțumim!</h1>
          <p className="text-muted-foreground mt-2">
            Cererea ta a fost trimisă. Te vom contacta în maxim 24 de ore cu o ofertă personalizată.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">🏢 Cadouri Corporate MamaLucica</h1>
          <p className="text-muted-foreground mt-2">
            Pachete personalizate cu logo-ul companiei tale pentru parteneri și angajați
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {["Minim 10 buc", "Logo pe lumânare/ambalaj", "Parfumuri personalizate", "Livrare în toată România", "Factură fiscală", "Termen: 7-14 zile"].map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Numele companiei *</Label>
              <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} required />
            </div>
            <div>
              <Label>Persoana de contact *</Label>
              <Input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <Label>Telefon *</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Număr bucăți dorite</Label>
              <Input type="number" min={10} value={form.units_needed} onChange={e => setForm(p => ({ ...p, units_needed: parseInt(e.target.value) || 10 }))} />
            </div>
            <div>
              <Label>Buget orientativ</Label>
              <Select value={form.budget_range} onValueChange={v => setForm(p => ({ ...p, budget_range: v }))}>
                <SelectTrigger><SelectValue placeholder="Alege..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sub-500">Sub 500 RON</SelectItem>
                  <SelectItem value="500-1000">500 - 1.000 RON</SelectItem>
                  <SelectItem value="1000-3000">1.000 - 3.000 RON</SelectItem>
                  <SelectItem value="3000-5000">3.000 - 5.000 RON</SelectItem>
                  <SelectItem value="peste-5000">Peste 5.000 RON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data livrare dorită</Label>
            <Input type="date" value={form.desired_delivery_date} onChange={e => setForm(p => ({ ...p, desired_delivery_date: e.target.value }))} />
          </div>
          <div>
            <Label>Detalii personalizare</Label>
            <Textarea value={form.personalization_details} onChange={e => setForm(p => ({ ...p, personalization_details: e.target.value }))} placeholder="Logo, parfumuri, culori, mesaje speciale..." rows={3} />
          </div>
          <div>
            <Label>Mesaj suplimentar</Label>
            <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Alte cerințe sau întrebări..." rows={2} />
          </div>
          <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
            {loading ? "Se trimite..." : "Solicită Ofertă"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
