import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ComenziEvenimente() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", eventType: "", quantity: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.eventType || !form.quantity) {
      toast.error("Completează toate câmpurile obligatorii");
      return;
    }
    await supabase.from("admin_notifications").insert({
      type: "event_inquiry",
      title: `Cerere evenimente: ${form.eventType} — ${form.quantity} buc`,
      message: `${form.name} (${form.email}, ${form.phone}): ${form.message}`,
      link: null,
    });
    toast.success("Cererea a fost trimisă!");
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-4 font-medium">Evenimente</p>
          <h1 className="font-serif text-4xl font-medium mb-4">Lumânări pentru Evenimente</h1>
          <p className="text-secondary-foreground/60">Nuntă · Botez · Corporate · Aniversare</p>
        </div>
      </section>

      <div className="container py-16 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">De ce VENTUZA</p>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-6">Momente Speciale, Lumânări Unice</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>Fiecare eveniment merită o atingere personală. Creăm lumânări handmade pentru momentele care contează — de la nunți elegante la botezuri emoționante.</p>
              <p>Oferim personalizare completă: logo, text, parfum și culoare la alegere. Minimum 10 bucăți, termen de producție 7-14 zile.</p>
            </div>
            <div className="mt-8 space-y-3">
              {["Personalizare completă", "Minim 10 bucăți", "Termen flexibil 7-14 zile", "Ambalaj premium inclus", "Factură fiscală"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="border border-border p-8 text-center">
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">Mulțumim!</h3>
                <p className="text-sm text-muted-foreground">Vom reveni cu o ofertă personalizată în 24-48 de ore.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-border p-8 space-y-4">
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">Solicită Ofertă</h3>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nume complet *" className="rounded-none" required />
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email *" type="email" className="rounded-none" required />
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Telefon" className="rounded-none" />
                <Select value={form.eventType} onValueChange={v => setForm(p => ({ ...p, eventType: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Tip eveniment *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nunta">Nuntă</SelectItem>
                    <SelectItem value="botez">Botez</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="aniversare">Aniversare</SelectItem>
                    <SelectItem value="altul">Altul</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Cantitate estimată *" className="rounded-none" required />
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Detalii suplimentare (parfum, culoare, text...)" className="rounded-none" rows={3} />
                <Button type="submit" className="w-full rounded-none h-11 text-xs tracking-wider uppercase bg-primary text-primary-foreground">
                  Trimite Cererea
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="ventuza-divider mb-12" />

        <div className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Proces</p>
          <h2 className="font-serif text-2xl font-medium text-foreground mb-10">Cum Funcționează</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {["Solicită Ofertă", "Confirmare Design", "Producție Manuală", "Livrare Eveniment"].map((step, i) => (
              <div key={i} className="text-center">
                <span className="font-serif text-3xl font-light text-primary/30 block mb-3">0{i + 1}</span>
                <p className="text-sm font-medium text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
