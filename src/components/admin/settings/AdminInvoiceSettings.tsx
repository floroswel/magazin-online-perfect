import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Receipt, Save, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceSettings {
  company_name: string;
  company_address: string;
  company_cui: string;
  company_reg_com: string;
  company_vat_number: string;
  company_bank: string;
  company_iban: string;
  invoice_prefix: string;
  invoice_start_number: number;
  auto_generate_on_confirm: boolean;
  auto_send_email: boolean;
  footer_text: string;
  template_style: string;
  default_vat_rate: number;
}

const DEFAULTS: InvoiceSettings = {
  company_name: "", company_address: "", company_cui: "", company_reg_com: "",
  company_vat_number: "", company_bank: "", company_iban: "",
  invoice_prefix: "FACT", invoice_start_number: 1,
  auto_generate_on_confirm: true, auto_send_email: true,
  footer_text: "Document valid fără semnătură și ștampilă conform art. 319 alin. 29 din Codul Fiscal.",
  template_style: "classic", default_vat_rate: 19,
};

export default function AdminInvoiceSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<InvoiceSettings>(DEFAULTS);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "invoice_settings")
        .maybeSingle();
      return data?.value_json as InvoiceSettings | null;
    },
  });

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "invoice_settings", value_json: form as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-settings"] });
      toast.success("Setări facturare salvate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (key: keyof InvoiceSettings, value: any) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Setări Facturare</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configurare date companie, serie facturi și opțiuni automatizare.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Salvează
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Company info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Building2 className="w-4 h-4" /> Date companie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-xs">Nume companie</Label><Input value={form.company_name} onChange={e => update("company_name", e.target.value)} /></div>
            <div><Label className="text-xs">Adresă sediu</Label><Input value={form.company_address} onChange={e => update("company_address", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">CUI / CIF</Label><Input value={form.company_cui} onChange={e => update("company_cui", e.target.value)} placeholder="RO12345678" /></div>
              <div><Label className="text-xs">Nr. Reg. Comerț</Label><Input value={form.company_reg_com} onChange={e => update("company_reg_com", e.target.value)} placeholder="J40/1234/2020" /></div>
            </div>
            <div><Label className="text-xs">Atribut TVA</Label><Input value={form.company_vat_number} onChange={e => update("company_vat_number", e.target.value)} placeholder="RO12345678" /></div>
            <Separator />
            <div><Label className="text-xs">Bancă</Label><Input value={form.company_bank} onChange={e => update("company_bank", e.target.value)} /></div>
            <div><Label className="text-xs">IBAN</Label><Input value={form.company_iban} onChange={e => update("company_iban", e.target.value)} placeholder="RO49AAAA..." /></div>
          </CardContent>
        </Card>

        {/* Series & automation */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Serie facturi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Prefix serie</Label><Input value={form.invoice_prefix} onChange={e => update("invoice_prefix", e.target.value)} placeholder="FACT" /></div>
                <div><Label className="text-xs">Nr. start</Label><Input type="number" value={form.invoice_start_number} onChange={e => update("invoice_start_number", Number(e.target.value))} /></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Format: {form.invoice_prefix}-{new Date().getFullYear()}-{String(form.invoice_start_number).padStart(5, "0")}</p>
              <div><Label className="text-xs">TVA implicit (%)</Label><Input type="number" value={form.default_vat_rate} onChange={e => update("default_vat_rate", Number(e.target.value))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Automatizare</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Generează factură automat la confirmarea comenzii</Label>
                <Switch checked={form.auto_generate_on_confirm} onCheckedChange={v => update("auto_generate_on_confirm", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Trimite factura pe email automat</Label>
                <Switch checked={form.auto_send_email} onCheckedChange={v => update("auto_send_email", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Șablon factură</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Stil layout</Label>
                <Select value={form.template_style} onValueChange={v => update("template_style", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Text legal footer</Label>
                <Textarea value={form.footer_text} onChange={e => update("footer_text", e.target.value)} rows={3} className="text-xs" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
