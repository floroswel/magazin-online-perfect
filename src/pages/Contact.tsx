import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Building2, FileText, ExternalLink } from "lucide-react";

export default function Contact() {
  const { settings: s } = useSettings();
  const [form, setForm] = useState({ email: "", name: "", phone: "", message: "" });
  const [privacyOk, setPrivacyOk] = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyOk) { toast.error("Trebuie să accepți Politica de Confidențialitate."); return; }
    if (!termsOk) { toast.error("Trebuie să accepți Termenii și Condițiile."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Email invalid."); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Telefon minim 10 cifre."); return; }
    if (form.message.length < 20) { toast.error("Mesajul trebuie să aibă minim 20 caractere."); return; }

    setSending(true);
    const { error } = await supabase.functions.invoke("send-contact-email", {
      body: { ...form, receiverEmail: s.contact_form_receiver_email || "contact@mamalucica.ro" },
    });
    setSending(false);

    if (error) { toast.error("Eroare la trimitere. Încearcă din nou."); return; }
    setSent(true);
    toast.success("Mesajul a fost trimis! Te contactăm în cel mult 1 zi lucrătoare.");
  };

  const docs = [1, 2, 3, 4].filter(i => s[`contact_doc${i}_show`] !== "false");
  const caenCodes = (s.contact_caen_codes || "").split("|").filter(Boolean);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* ROW 1 — Form + Company info */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* LEFT — Contact Form (60%) */}
          {s.contact_form_show !== "false" && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{s.contact_form_title || "Contactează-ne"}</h1>
                {s.contact_form_subtitle && (
                  <p className="text-muted-foreground mt-1">{s.contact_form_subtitle}</p>
                )}
              </div>

              {sent ? (
                <div className="bg-secondary/30 border border-primary/20 rounded-lg p-6 text-center">
                  <p className="text-primary font-semibold">✅ Mesajul a fost trimis!</p>
                  <p className="text-muted-foreground text-sm mt-1">Te contactăm în cel mult 1 zi lucrătoare.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="c-email">Email *</Label>
                    <Input id="c-email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-name">Nume *</Label>
                    <Input id="c-name" required value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-phone">Telefon *</Label>
                    <Input id="c-phone" type="tel" required value={form.phone} onChange={e => set("phone", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-msg">Mesajul tău *</Label>
                    <Textarea id="c-msg" required rows={5} value={form.message} onChange={e => set("message", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox id="c-privacy" checked={privacyOk} onCheckedChange={v => setPrivacyOk(!!v)} className="mt-0.5" />
                      <label htmlFor="c-privacy" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                        Sunt de acord cu prelucrarea datelor personale conform{" "}
                        <a href="/politica-de-confidentialitate" className="underline text-primary" target="_blank">Politicii de Confidențialitate</a> *
                      </label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="c-terms" checked={termsOk} onCheckedChange={v => setTermsOk(!!v)} className="mt-0.5" />
                      <label htmlFor="c-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                        Sunt de acord cu{" "}
                        <a href="/termeni-si-conditii" className="underline text-primary" target="_blank">Termenii și Condițiile</a> *
                      </label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto"
                    style={{ backgroundColor: s.contact_form_btn_color || "#0066FF" }}
                  >
                    {sending ? "Se trimite..." : (s.contact_form_btn_text || "Trimite mesaj")}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* RIGHT — Company + Contact + Support (40%) */}
          <div className="md:col-span-2 space-y-6">
            {/* Company info */}
            {s.contact_company_show !== "false" && (
              <div className="bg-card border rounded-lg p-5 space-y-2">
                <h2 className="font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> {s.contact_company_title || "Mama Lucica SRL"}
                </h2>
                <div className="text-sm space-y-1 text-muted-foreground">
                  {s.contact_cod_fiscal && <p>Cod Fiscal: <strong>{s.contact_cod_fiscal}</strong></p>}
                  {s.contact_nr_reg_com && <p>Nr. Reg. Com.: <strong>{s.contact_nr_reg_com}</strong></p>}
                  {s.contact_sediu_social && <p>Sediu Social: <strong>{s.contact_sediu_social}</strong></p>}
                  {s.contact_show_cont_bancar === "true" && (() => {
                    let accounts: { iban: string; bank: string }[] = [];
                    try { accounts = JSON.parse(s.contact_bank_accounts || "[]"); } catch { accounts = []; }
                    if (!Array.isArray(accounts)) accounts = [];
                    // Fallback to old single fields
                    if (accounts.length === 0 && s.contact_cont_bancar) {
                      accounts = [{ iban: s.contact_cont_bancar, bank: s.contact_banca || "" }];
                    }
                    return accounts.filter(a => a.iban).map((acc, i) => (
                      <div key={i}>
                        <p>Cont Bancar: <strong>{acc.iban}</strong></p>
                        {acc.bank && <p>Bancă: <strong>{acc.bank}</strong></p>}
                      </div>
                    ));
                  })()}
                  {s.contact_capital_social && <p>Capital Social: <strong>{s.contact_capital_social}</strong></p>}
                </div>
              </div>
            )}

            {/* Contact details */}
            {s.contact_section_contact_show !== "false" && (
              <div className="bg-card border rounded-lg p-5 space-y-2">
                <h2 className="font-bold">Contact</h2>
                <div className="text-sm space-y-2 text-muted-foreground">
                  {s.contact_email_show !== "false" && s.footer_email && (
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {s.footer_email}</p>
                  )}
                  {s.contact_phone_show !== "false" && s.footer_phone && (
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.footer_phone}</p>
                  )}
                  {s.contact_address_show !== "false" && s.footer_address && (
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {s.footer_address}</p>
                  )}
                  {s.contact_cod_postal_show === "true" && s.contact_cod_postal && (
                    <p className="ml-6">Cod Poștal: {s.contact_cod_postal}</p>
                  )}
                </div>
              </div>
            )}

            {/* Support */}
            {s.contact_support_show !== "false" && (
              <div className="bg-card border rounded-lg p-5 space-y-2">
                <h2 className="font-bold">{s.contact_support_title || "Suport clienți"}</h2>
                <p className="text-sm text-muted-foreground">{s.contact_support_text}</p>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2 — ANPC Documents */}
        {s.contact_docs_show !== "false" && (
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h2 className="font-bold">Documente conform ANPC 225/2023</h2>
                <p className="text-sm text-muted-foreground mt-1">{s.contact_docs_anpc_text}</p>
              </div>
            </div>
            <ul className="space-y-2 ml-7">
              {docs.map(i => {
                const label = s[`contact_doc${i}_label`];
                const url = s[`contact_doc${i}_url`];
                if (!label) return null;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span>•</span>
                    <span>{label},</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium flex items-center gap-1">
                        click AICI <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic cursor-not-allowed" title="Document în curs de încărcare">
                        AICI (în curs de încărcare)
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* CAEN Codes */}
            {s.contact_caen_show !== "false" && caenCodes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-sm mb-2">Coduri CAEN:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {caenCodes.map((code, i) => <li key={i}>• {code}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ROW 3 — Google Maps */}
        {s.contact_map_show === "true" && s.contact_map_embed_url && (
          <div className="rounded-lg overflow-hidden border">
            <iframe
              src={s.contact_map_embed_url}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Locație pe hartă"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
