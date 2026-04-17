import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, GripVertical, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReturnReason {
  id: string;
  text: string;
  image_requirement: "disabled" | "optional" | "required";
}

interface ReturnFormSettings {
  id: string;
  enabled: boolean;
  returnable_products: string;
  returnable_category_ids: string[] | null;
  return_window_days: number;
  extended_return_window_days: number | null;
  allow_same_product_exchange: boolean;
  allow_different_product_exchange: boolean;
  allow_order_cancellation: boolean;
  return_reasons: ReturnReason[];
  courier_pickup: string;
  allow_bank_refund: boolean;
  allow_wallet_refund: boolean;
  allow_multiple_returns_per_order: boolean;
  allow_partial_returns: boolean;
  show_footer_link: boolean;
  footer_link_text: string;
  return_shipping_cost: number;
  exchange_shipping_cost: number;
  restocking_fee_percent: number;
  auto_approve: boolean;
  require_order_delivered: boolean;
  allow_guest_returns: boolean;
  processing_sla_days: number;
  return_address: string;
  non_returnable_tags: string[];
  // GDPR
  require_gdpr_consent: boolean;
  gdpr_consent_text: string;
  return_policy_text: string;
  // Admin
  admin_notification_email: string;
  // Emails
  notify_on_created: boolean;
  notify_on_approved: boolean;
  notify_on_rejected: boolean;
  notify_on_received: boolean;
  notify_on_refunded: boolean;
  email_created_subject: string;
  email_created_body: string;
  email_approved_subject: string;
  email_approved_body: string;
  email_rejected_subject: string;
  email_rejected_body: string;
  email_received_subject: string;
  email_received_body: string;
  email_refunded_subject: string;
  email_refunded_body: string;
}

export default function AdminReturnSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReturnFormSettings | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await (supabase as any).from("return_form_settings").select("*").limit(1).single();
    if (data) {
      setSettings({
        ...data,
        return_reasons: Array.isArray(data.return_reasons) ? data.return_reasons : [],
        returnable_category_ids: data.returnable_category_ids || null,
        non_returnable_tags: Array.isArray(data.non_returnable_tags) ? data.non_returnable_tags : [],
        extended_return_window_days: data.extended_return_window_days ?? null,
        restocking_fee_percent: data.restocking_fee_percent ?? 0,
        processing_sla_days: data.processing_sla_days ?? 14,
        return_address: data.return_address ?? "",
        admin_notification_email: data.admin_notification_email ?? "",
        return_policy_text: data.return_policy_text ?? "",
        require_gdpr_consent: data.require_gdpr_consent ?? true,
        gdpr_consent_text: data.gdpr_consent_text ?? "",
        allow_wallet_refund: data.allow_wallet_refund ?? true,
        require_order_delivered: data.require_order_delivered ?? true,
        allow_guest_returns: data.allow_guest_returns ?? true,
        notify_on_received: data.notify_on_received ?? true,
        notify_on_refunded: data.notify_on_refunded ?? true,
        email_received_subject: data.email_received_subject ?? "",
        email_received_body: data.email_received_body ?? "",
        email_refunded_subject: data.email_refunded_subject ?? "",
        email_refunded_body: data.email_refunded_body ?? "",
      } as ReturnFormSettings);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    await (supabase as any).from("return_form_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
    toast({ title: "Setări salvate ✓" });
  }

  function addReason() {
    if (!settings) return;
    setSettings({
      ...settings,
      return_reasons: [...settings.return_reasons, { id: `reason_${Date.now()}`, text: "", image_requirement: "disabled" }],
    });
  }

  function updateReason(idx: number, field: keyof ReturnReason, value: string) {
    if (!settings) return;
    const reasons = [...settings.return_reasons];
    reasons[idx] = { ...reasons[idx], [field]: value };
    setSettings({ ...settings, return_reasons: reasons });
  }

  function removeReason(idx: number) {
    if (!settings) return;
    setSettings({ ...settings, return_reasons: settings.return_reasons.filter((_, i) => i !== idx) });
  }

  function addTag() {
    if (!settings || !newTag.trim()) return;
    if (settings.non_returnable_tags.includes(newTag.trim())) return;
    setSettings({ ...settings, non_returnable_tags: [...settings.non_returnable_tags, newTag.trim()] });
    setNewTag("");
  }

  function removeTag(tag: string) {
    if (!settings) return;
    setSettings({ ...settings, non_returnable_tags: settings.non_returnable_tags.filter(t => t !== tag) });
  }

  const upd = (field: string, value: any) => setSettings(s => s ? { ...s, [field]: value } : s);

  if (loading || !settings) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formular Retur</h1>
          <p className="text-sm text-muted-foreground">Configurare enterprise a modulului de retururi & schimburi.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch checked={settings.enabled} onCheckedChange={(v) => upd("enabled", v)} />
            <Label className="font-medium">{settings.enabled ? "Activ" : "Inactiv"}</Label>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />{saving ? "Salvare..." : "Salvează"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="products">Produse & Eligibilitate</TabsTrigger>
          <TabsTrigger value="logistics">Logistică & Costuri</TabsTrigger>
          <TabsTrigger value="approval">Aprobare & SLA</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR & Legal</TabsTrigger>
          <TabsTrigger value="emails">Email-uri</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Produse & Eligibilitate ─── */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Produse eligibile pentru retur</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={settings.returnable_products === "all"} onChange={() => upd("returnable_products", "all")} />
                  Orice produs
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={settings.returnable_products === "category_collection"} onChange={() => upd("returnable_products", "category_collection")} />
                  Doar din categorii selectate
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Produse non-returnabile (tag-uri)</CardTitle>
              <CardDescription>Produsele cu aceste tag-uri vor fi excluse din formularul de retur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ex: personalizat, igienă, lichide..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button variant="outline" size="sm" onClick={addTag}><Plus className="w-3 h-3 mr-1" />Adaugă</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.non_returnable_tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <Trash2 className="w-3 h-3" />
                  </Badge>
                ))}
                {settings.non_returnable_tags.length === 0 && <span className="text-xs text-muted-foreground">Niciun tag adăugat</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Perioadă retur</CardTitle>
              <CardDescription>Conform OUG 34/2014, perioada legală minimă este de 14 zile calendaristice de la primirea coletului.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input type="number" value={settings.return_window_days} onChange={(e) => upd("return_window_days", parseInt(e.target.value) || 0)} className="w-24" />
                <span className="text-sm text-muted-foreground">zile de la livrare (0 = nelimitat)</span>
              </div>
              <div className="flex items-center gap-3">
                <Input type="number" value={settings.extended_return_window_days ?? ""} onChange={(e) => upd("extended_return_window_days", e.target.value ? parseInt(e.target.value) : null)} className="w-24" placeholder="—" />
                <span className="text-sm text-muted-foreground">perioadă extinsă (opțional, override peste valoarea standard)</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Necesită status „Livrat" pe comandă</Label>
                  <p className="text-xs text-muted-foreground">Dacă este activ, doar comenzile cu status livrat pot fi returnate</p>
                </div>
                <Switch checked={settings.require_order_delivered} onCheckedChange={(v) => upd("require_order_delivered", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Opțiuni schimb & anulare</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permite schimbul cu același produs</Label>
                <Switch checked={settings.allow_same_product_exchange} onCheckedChange={(v) => upd("allow_same_product_exchange", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite schimbul cu alt produs</Label>
                <Switch checked={settings.allow_different_product_exchange} onCheckedChange={(v) => upd("allow_different_product_exchange", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permite anularea comenzii de către client</Label>
                  <p className="text-xs text-muted-foreground">Disponibil cât timp comanda nu a fost expediată</p>
                </div>
                <Switch checked={settings.allow_order_cancellation} onCheckedChange={(v) => upd("allow_order_cancellation", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Motive retur</CardTitle>
                <Button variant="outline" size="sm" onClick={addReason}><Plus className="w-3 h-3 mr-1" />Adaugă motiv</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {settings.return_reasons.map((reason, i) => (
                <div key={reason.id} className="flex gap-2 items-center border rounded-md p-2 bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <Input value={reason.text} onChange={(e) => updateReason(i, "text", e.target.value)} placeholder="Text motiv..." className="flex-1" />
                  <Select value={reason.image_requirement} onValueChange={(v) => updateReason(i, "image_requirement", v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Imagine dezactivată</SelectItem>
                      <SelectItem value="optional">Imagine opțională</SelectItem>
                      <SelectItem value="required">Imagine obligatorie</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeReason(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              {settings.return_reasons.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Adaugă cel puțin un motiv de retur.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: Logistică & Costuri ─── */}
        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Ridicare colet</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(["customer", "merchant", "customer_choice"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="radio" checked={settings.courier_pickup === opt} onChange={() => upd("courier_pickup", opt)} />
                  {opt === "customer" ? "Clientul trimite coletul" : opt === "merchant" ? "Comerciantul trimite curier" : "La alegerea clientului"}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Adresă retur magazin</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={settings.return_address} onChange={(e) => upd("return_address", e.target.value)} placeholder="Adresa completă unde se trimit coletele returnate..." rows={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Opțiuni rambursare</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permite rambursarea în cont bancar</Label>
                <Switch checked={settings.allow_bank_refund} onCheckedChange={(v) => upd("allow_bank_refund", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permite rambursarea în portofel (wallet / credit magazin)</Label>
                  <p className="text-xs text-muted-foreground">Clientul primește suma ca credit în cont, utilizabil la comenzi viitoare</p>
                </div>
                <Switch checked={settings.allow_wallet_refund} onCheckedChange={(v) => upd("allow_wallet_refund", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite multiple cereri de retur pentru aceeași comandă</Label>
                <Switch checked={settings.allow_multiple_returns_per_order} onCheckedChange={(v) => upd("allow_multiple_returns_per_order", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite retururi parțiale (selectare cantitate)</Label>
                <Switch checked={settings.allow_partial_returns} onCheckedChange={(v) => upd("allow_partial_returns", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Costuri & Taxe</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cost transport retur (RON)</Label>
                  <Input type="number" value={settings.return_shipping_cost} onChange={(e) => upd("return_shipping_cost", parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground mt-1">0 = gratuit</p>
                </div>
                <div>
                  <Label>Cost transport schimb (RON)</Label>
                  <Input type="number" value={settings.exchange_shipping_cost} onChange={(e) => upd("exchange_shipping_cost", parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground mt-1">0 = gratuit</p>
                </div>
                <div>
                  <Label>Taxă restocking (%)</Label>
                  <Input type="number" min={0} max={100} value={settings.restocking_fee_percent} onChange={(e) => upd("restocking_fee_percent", parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground mt-1">0 = fără taxă</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Footer & Vizitatori</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Link formular retur în footer</Label>
                <Switch checked={settings.show_footer_link} onCheckedChange={(v) => upd("show_footer_link", v)} />
              </div>
              {settings.show_footer_link && (
                <div>
                  <Label>Text link footer</Label>
                  <Input value={settings.footer_link_text} onChange={(e) => upd("footer_link_text", e.target.value)} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permite retururi pentru vizitatori (guest)</Label>
                  <p className="text-xs text-muted-foreground">Clienții fără cont pot iniția retururi cu nr. comandă + email</p>
                </div>
                <Switch checked={settings.allow_guest_returns} onCheckedChange={(v) => upd("allow_guest_returns", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: Aprobare & SLA ─── */}
        <TabsContent value="approval" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aprobare automată</CardTitle>
              <CardDescription>Când este activat, cererile de retur sunt aprobate automat la trimitere.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Aprobă automat cererile de retur</Label>
                <Switch checked={settings.auto_approve} onCheckedChange={(v) => upd("auto_approve", v)} />
              </div>
              {settings.auto_approve && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Atenție: aprobarea automată permite tuturor cererilor să fie procesate fără verificare manuală.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SLA Procesare</CardTitle>
              <CardDescription>Termenul maxim (în zile) în care trebuie procesată o cerere de retur de la primirea ei.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input type="number" value={settings.processing_sla_days} onChange={(e) => upd("processing_sla_days", parseInt(e.target.value) || 14)} className="w-24" />
                <span className="text-sm text-muted-foreground">zile (conform OUG 34/2014, rambursarea se face în max. 14 zile)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Notificări admin</CardTitle></CardHeader>
            <CardContent>
              <Label>Email administrator (pentru notificări cereri noi)</Label>
              <Input type="email" value={settings.admin_notification_email} onChange={(e) => upd("admin_notification_email", e.target.value)} placeholder="admin@magazin.ro" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Lasă gol pentru a utiliza doar notificările din panoul admin.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: GDPR & Legal ─── */}
        <TabsContent value="gdpr" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consimțământ GDPR</CardTitle>
              <CardDescription>Afișează o bifă obligatorie în formularul de retur înainte de trimitere.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Necesită consimțământ GDPR</Label>
                <Switch checked={settings.require_gdpr_consent} onCheckedChange={(v) => upd("require_gdpr_consent", v)} />
              </div>
              {settings.require_gdpr_consent && (
                <div>
                  <Label>Text consimțământ</Label>
                  <Textarea value={settings.gdpr_consent_text} onChange={(e) => upd("gdpr_consent_text", e.target.value)} rows={3} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Politica de retur</CardTitle>
              <CardDescription>Textul legal afișat clientului în formularul de retur. Suportă variabile: {"{store_name}"}, {"{return_days}"}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={settings.return_policy_text} onChange={(e) => upd("return_policy_text", e.target.value)} rows={5} placeholder="Conform OUG 34/2014..." />
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Datele personale din cererile de retur (IBAN, adresă, telefon) sunt stocate criptat și supuse politicii GDPR a magazinului. Consimțământul GDPR este înregistrat cu timestamp în baza de date pentru audit.</span>
          </div>
        </TabsContent>

        {/* ─── TAB 5: Email-uri ─── */}
        <TabsContent value="emails" className="space-y-4">
          {/* Created */}
          <EmailNotificationCard
            title="Notificare cerere generată"
            enabled={settings.notify_on_created}
            onToggle={(v) => upd("notify_on_created", v)}
            subject={settings.email_created_subject}
            onSubjectChange={(v) => upd("email_created_subject", v)}
            body={settings.email_created_body}
            onBodyChange={(v) => upd("email_created_body", v)}
            placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {return_date}, {products_list}, {store_name}"
          />
          {/* Approved */}
          <EmailNotificationCard
            title="Notificare cerere aprobată"
            enabled={settings.notify_on_approved}
            onToggle={(v) => upd("notify_on_approved", v)}
            subject={settings.email_approved_subject}
            onSubjectChange={(v) => upd("email_approved_subject", v)}
            body={settings.email_approved_body}
            onBodyChange={(v) => upd("email_approved_body", v)}
            placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {refund_method}, {store_name}"
          />
          {/* Rejected */}
          <EmailNotificationCard
            title="Notificare cerere respinsă"
            enabled={settings.notify_on_rejected}
            onToggle={(v) => upd("notify_on_rejected", v)}
            subject={settings.email_rejected_subject}
            onSubjectChange={(v) => upd("email_rejected_subject", v)}
            body={settings.email_rejected_body}
            onBodyChange={(v) => upd("email_rejected_body", v)}
            placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {rejection_reason}, {store_name}"
          />
          {/* Received */}
          <EmailNotificationCard
            title="Notificare produse primite"
            enabled={settings.notify_on_received}
            onToggle={(v) => upd("notify_on_received", v)}
            subject={settings.email_received_subject}
            onSubjectChange={(v) => upd("email_received_subject", v)}
            body={settings.email_received_body}
            onBodyChange={(v) => upd("email_received_body", v)}
            placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {received_date}, {store_name}"
          />
          {/* Refunded */}
          <EmailNotificationCard
            title="Notificare rambursare procesată"
            enabled={settings.notify_on_refunded}
            onToggle={(v) => upd("notify_on_refunded", v)}
            subject={settings.email_refunded_subject}
            onSubjectChange={(v) => upd("email_refunded_subject", v)}
            body={settings.email_refunded_body}
            onBodyChange={(v) => upd("email_refunded_body", v)}
            placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {refund_amount}, {refund_method}, {store_name}"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmailNotificationCard({ title, enabled, onToggle, subject, onSubjectChange, body, onBodyChange, placeholder }: {
  title: string; enabled: boolean; onToggle: (v: boolean) => void;
  subject: string; onSubjectChange: (v: string) => void;
  body: string; onBodyChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-2">
          <div><Label>Subiect</Label><Input value={subject} onChange={(e) => onSubjectChange(e.target.value)} /></div>
          <div><Label>Corp email</Label><Textarea value={body} onChange={(e) => onBodyChange(e.target.value)} rows={4} placeholder={placeholder} /></div>
        </CardContent>
      )}
    </Card>
  );
}
