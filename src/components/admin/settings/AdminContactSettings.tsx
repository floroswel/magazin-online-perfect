import { useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

function Toggle({ label, k, s, save }: { label: string; k: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={s[k] === "true"} onCheckedChange={v => save(k, v ? "true" : "false")} />
    </div>
  );
}

function Field({ label, k, s, save, placeholder, type }: { label: string; k: string; s: Record<string, string>; save: (k: string, v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {type === "textarea" ? (
        <Textarea value={s[k] || ""} placeholder={placeholder} onChange={e => save(k, e.target.value)} rows={3} />
      ) : (
        <Input value={s[k] || ""} placeholder={placeholder} onChange={e => save(k, e.target.value)} />
      )}
    </div>
  );
}

function ColorField({ label, k, s, save }: { label: string; k: string; s: Record<string, string>; save: (k: string, v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="min-w-[140px]">{label}</Label>
      <input type="color" value={s[k] || "#0066FF"} onChange={e => save(k, e.target.value)} className="w-10 h-8 rounded border cursor-pointer" />
      <Input value={s[k] || ""} onChange={e => save(k, e.target.value)} className="w-28" />
    </div>
  );
}

export default function AdminContactSettings() {
  const { settings: s, updateSetting } = useSettings();

  const save = useCallback((key: string, value: string) => {
    updateSetting(key, value).then(ok => { if (ok) toast.success("Salvat ✓"); });
  }, [updateSetting]);

  const caenCodes = (s.contact_caen_codes || "").split("|").filter(Boolean);
  const setCaen = (codes: string[]) => save("contact_caen_codes", codes.join("|"));

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Setări Pagina Contact</h1>
        <p className="text-muted-foreground">Configurează formularul de contact, datele firmei și documentele ANPC.</p>
      </div>

      {/* 1. FORMULAR */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Formular Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează formularul" k="contact_form_show" s={s} save={save} />
          <Field label="Titlu" k="contact_form_title" s={s} save={save} />
          <Field label="Subtitlu" k="contact_form_subtitle" s={s} save={save} type="textarea" />
          <Field label="Text buton" k="contact_form_btn_text" s={s} save={save} />
          <ColorField label="Culoare buton" k="contact_form_btn_color" s={s} save={save} />
          <Field label="Email destinatar" k="contact_form_receiver_email" s={s} save={save} placeholder="contact@mamalucica.ro" />
          <Field label="Text GDPR" k="contact_form_gdpr_text" s={s} save={save} type="textarea" />
        </CardContent>
      </Card>

      {/* 2. DATE FIRMĂ */}
      <Card>
        <CardHeader><CardTitle className="text-base">2. Date Firmă</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează bloc" k="contact_company_show" s={s} save={save} />
          <Field label="Nume firmă" k="contact_company_title" s={s} save={save} />
          <Field label="Cod Fiscal" k="contact_cod_fiscal" s={s} save={save} />
          <Field label="Nr. Reg. Com." k="contact_nr_reg_com" s={s} save={save} />
          <Field label="Sediu Social" k="contact_sediu_social" s={s} save={save} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cont Bancar" k="contact_cont_bancar" s={s} save={save} />
            <Toggle label="Afișează cont" k="contact_show_cont_bancar" s={s} save={save} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bancă" k="contact_banca" s={s} save={save} />
            <Toggle label="Afișează banca" k="contact_show_banca" s={s} save={save} />
          </div>
          <Field label="Capital Social" k="contact_capital_social" s={s} save={save} />
        </CardContent>
      </Card>

      {/* 3. DATE CONTACT */}
      <Card>
        <CardHeader><CardTitle className="text-base">3. Date Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează email" k="contact_email_show" s={s} save={save} />
          <p className="text-xs text-muted-foreground">Email se citește din setările footer ({s.footer_email || "nesetat"})</p>
          <Toggle label="Afișează telefon" k="contact_phone_show" s={s} save={save} />
          <p className="text-xs text-muted-foreground">Telefon se citește din setările footer ({s.footer_phone || "nesetat"})</p>
          <Toggle label="Afișează adresă" k="contact_address_show" s={s} save={save} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cod Poștal" k="contact_cod_postal" s={s} save={save} />
            <Toggle label="Afișează cod poștal" k="contact_cod_postal_show" s={s} save={save} />
          </div>
        </CardContent>
      </Card>

      {/* 4. SUPORT */}
      <Card>
        <CardHeader><CardTitle className="text-base">4. Suport Clienți</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează secțiunea" k="contact_support_show" s={s} save={save} />
          <Field label="Titlu" k="contact_support_title" s={s} save={save} />
          <Field label="Text" k="contact_support_text" s={s} save={save} type="textarea" />
        </CardContent>
      </Card>

      {/* 5. DOCUMENTE ANPC */}
      <Card>
        <CardHeader><CardTitle className="text-base">5. Documente ANPC 225/2023</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează blocul" k="contact_docs_show" s={s} save={save} />
          <Field label="Text introductiv ANPC" k="contact_docs_anpc_text" s={s} save={save} type="textarea" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded p-3 space-y-2">
              <Toggle label={`Document ${i}`} k={`contact_doc${i}_show`} s={s} save={save} />
              <Field label="Label" k={`contact_doc${i}_label`} s={s} save={save} />
              <Field label="URL document (PDF)" k={`contact_doc${i}_url`} s={s} save={save} placeholder="https://..." />
              {s[`contact_doc${i}_url`] && (
                <a href={s[`contact_doc${i}_url`]} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                  Preview link →
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 6. CODURI CAEN */}
      <Card>
        <CardHeader><CardTitle className="text-base">6. Coduri CAEN</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează codurile CAEN" k="contact_caen_show" s={s} save={save} />
          {caenCodes.map((code, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={code} onChange={e => { const arr = [...caenCodes]; arr[i] = e.target.value; setCaen(arr); }} className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => setCaen(caenCodes.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setCaen([...caenCodes, "XXXX - Descriere"])}>
            <Plus className="h-4 w-4 mr-1" /> Adaugă cod CAEN
          </Button>
        </CardContent>
      </Card>

      {/* 7. HARTĂ */}
      <Card>
        <CardHeader><CardTitle className="text-base">7. Hartă Google Maps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Afișează harta" k="contact_map_show" s={s} save={save} />
          <Field label="URL embed" k="contact_map_embed_url" s={s} save={save} type="textarea" placeholder="https://www.google.com/maps/embed?..." />
          <p className="text-xs text-muted-foreground">
            Mergi pe Google Maps → Share → Embed a map → copiază src-ul din iframe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
