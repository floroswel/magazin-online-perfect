import { useState } from "react";
import { Mail, Phone, MapPin, Clock, FileText, Building2, Send, Loader2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SeoHead from "@/components/SeoHead";

const unq = (s?: string) => (s || "").replace(/^"|"$/g, "");
const truthy = (v?: string) => v !== "false" && v !== '"false"' && v !== undefined;

export default function Contact() {
  const { settings: s } = useSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "", gdpr: false });

  // Form
  const formShow = truthy(s.contact_form_show);
  const formTitle = unq(s.contact_form_title) || "Trimite-ne un mesaj";
  const formSubtitle = unq(s.contact_form_subtitle) || "Îți răspundem în maxim 24h lucrătoare.";
  const formBtnText = unq(s.contact_form_btn_text) || "Trimite mesaj";
  const formBtnColor = unq(s.contact_form_btn_color);
  const gdprText = unq(s.contact_form_gdpr_text) ||
    "Sunt de acord cu prelucrarea datelor mele personale conform Politicii de Confidențialitate.";

  // Contact section
  const contactShow = truthy(s.contact_section_contact_show);
  const email = unq(s.contact_email) || "contact@mamalucica.ro";
  const phone = unq(s.contact_phone) || "+40 743 326 405";
  const address = unq(s.contact_address) || "București, România";
  const codPostal = unq(s.contact_cod_postal);
  const schedule = unq(s.contact_schedule) || "Luni - Vineri, 9:00 - 17:00";

  // Company / legal
  const companyShow = truthy(s.contact_company_show);
  const companyTitle = unq(s.contact_company_title) || "Date firmă";
  const codFiscal = unq(s.contact_cod_fiscal);
  const nrRegCom = unq(s.contact_nr_reg_com);
  const sediu = unq(s.contact_sediu_social);
  const capital = unq(s.contact_capital_social);
  const banca = unq(s.contact_banca);
  const cont = unq(s.contact_cont_bancar);

  // Support
  const supportShow = truthy(s.contact_support_show);
  const supportTitle = unq(s.contact_support_title) || "Suport clienți";
  const supportText = unq(s.contact_support_text);

  // Documents (ANPC, etc)
  const docsShow = truthy(s.contact_docs_show);
  const docsAnpcText = unq(s.contact_docs_anpc_text) || "Documente ANPC obligatorii (OUG 225/2023)";
  const docs = [1, 2, 3, 4]
    .filter(n => truthy(s[`contact_doc${n}_show`]))
    .map(n => ({ label: unq(s[`contact_doc${n}_label`]), url: unq(s[`contact_doc${n}_url`]) }))
    .filter(d => d.label && d.url);

  // CAEN codes
  const caenShow = truthy(s.contact_caen_show);
  const caenCodes = unq(s.contact_caen_codes);

  // Map
  const mapShow = truthy(s.contact_map_show);
  const mapEmbed = unq(s.contact_map_embed_url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gdpr) {
      toast.error("Te rugăm să accepți Politica de Confidențialitate");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { ...form, to: unq(s.contact_form_receiver_email) || email },
      });
      if (error) throw error;
      toast.success("Mesaj trimis! Îți răspundem în curând.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "", gdpr: false });
    } catch (err: any) {
      toast.error(err.message || "Eroare la trimitere");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="Contact" description="Contactează-ne — Mama Lucica" />
      <div className="bg-white text-foreground ml-container py-10 lg:py-16">
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="font-display text-4xl lg:text-5xl mb-3">Contactează-ne</h1>
          <p className="text-muted-foreground">{formSubtitle}</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          {formShow && (
            <Card className="lg:col-span-2 p-6 lg:p-8">
              <h2 className="font-display text-2xl mb-6">{formTitle}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nume complet *</Label>
                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefon</Label>
                    <Input type="tel" inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Subiect *</Label>
                    <Input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Mesaj *</Label>
                  <Textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="gdpr" checked={form.gdpr} onCheckedChange={v => setForm({ ...form, gdpr: !!v })} />
                  <label htmlFor="gdpr" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">{gdprText}</label>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto"
                  style={formBtnColor ? { backgroundColor: formBtnColor } : undefined}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {formBtnText}
                </Button>
              </form>
            </Card>
          )}

          {/* Sidebar */}
          <aside className="space-y-6">
            {contactShow && (
              <Card className="p-6">
                <h3 className="font-display text-lg mb-4">Date de contact</h3>
                <ul className="space-y-3 text-sm">
                  {truthy(s.contact_email_show) && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                      <a href={`mailto:${email}`} className="hover:text-accent">{email}</a>
                    </li>
                  )}
                  {truthy(s.contact_phone_show) && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                      <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-accent">{phone}</a>
                    </li>
                  )}
                  {truthy(s.contact_address_show) && (
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                      <span>{address}{truthy(s.contact_cod_postal_show) && codPostal && `, ${codPostal}`}</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                    <span>{schedule}</span>
                  </li>
                </ul>
              </Card>
            )}

            {supportShow && supportText && (
              <Card className="p-6">
                <h3 className="font-display text-lg mb-3">{supportTitle}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{supportText}</p>
              </Card>
            )}

            {companyShow && (
              <Card className="p-6">
                <h3 className="font-display text-lg mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" /> {companyTitle}
                </h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {codFiscal && <li><strong>CUI:</strong> {codFiscal}</li>}
                  {nrRegCom && <li><strong>Reg. Com.:</strong> {nrRegCom}</li>}
                  {sediu && <li><strong>Sediu:</strong> {sediu}</li>}
                  {capital && <li><strong>Capital social:</strong> {capital}</li>}
                  {truthy(s.contact_show_banca) && banca && <li><strong>Bancă:</strong> {banca}</li>}
                  {truthy(s.contact_show_cont_bancar) && cont && <li className="break-all"><strong>IBAN:</strong> {cont}</li>}
                </ul>
              </Card>
            )}

            {caenShow && caenCodes && (
              <Card className="p-6">
                <h3 className="font-display text-base mb-2">Coduri CAEN</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{caenCodes}</p>
              </Card>
            )}
          </aside>
        </div>

        {/* Documents ANPC */}
        {docsShow && docs.length > 0 && (
          <Card className="mt-8 p-6 lg:p-8">
            <h3 className="font-display text-xl mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" /> {docsAnpcText}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {docs.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded hover:bg-muted text-sm transition-colors">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <span>{d.label}</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Map */}
        {mapShow && mapEmbed && (
          <Card className="mt-8 overflow-hidden">
            <iframe src={mapEmbed} className="w-full h-[400px] border-0" loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="Locație magazin" />
          </Card>
        )}
      </div>
    </>
  );
}
