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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
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
  allow_same_product_exchange: boolean;
  allow_different_product_exchange: boolean;
  allow_order_cancellation: boolean;
  return_reasons: ReturnReason[];
  courier_pickup: string;
  allow_bank_refund: boolean;
  allow_multiple_returns_per_order: boolean;
  allow_partial_returns: boolean;
  show_footer_link: boolean;
  footer_link_text: string;
  return_shipping_cost: number;
  exchange_shipping_cost: number;
  auto_approve: boolean;
  notify_on_created: boolean;
  notify_on_approved: boolean;
  notify_on_rejected: boolean;
  email_created_subject: string;
  email_created_body: string;
  email_approved_subject: string;
  email_approved_body: string;
  email_rejected_subject: string;
  email_rejected_body: string;
}

export default function AdminReturnSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReturnFormSettings | null>(null);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await (supabase as any).from("return_form_settings").select("*").limit(1).single();
    if (data) {
      setSettings({
        ...data,
        return_reasons: Array.isArray(data.return_reasons) ? data.return_reasons : [],
        returnable_category_ids: data.returnable_category_ids || null,
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
    const newId = `reason_${Date.now()}`;
    setSettings({
      ...settings,
      return_reasons: [...settings.return_reasons, { id: newId, text: "", image_requirement: "disabled" }],
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

  if (loading || !settings) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formular Retur</h1>
          <p className="text-sm text-muted-foreground">Configurează formularul de retur pentru clienți.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
            <Label className="font-medium">{settings.enabled ? "Activ" : "Inactiv"}</Label>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />{saving ? "Salvare..." : "Salvează"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Setări retur produse</TabsTrigger>
          <TabsTrigger value="logistics">Setări retur (logistică)</TabsTrigger>
          <TabsTrigger value="approval">Aprobare cereri</TabsTrigger>
          <TabsTrigger value="emails">Setări email-uri</TabsTrigger>
        </TabsList>

        {/* TAB 1 */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Produse eligibile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={settings.returnable_products === "all"} onChange={() => setSettings({ ...settings, returnable_products: "all" })} />
                  Orice produs
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={settings.returnable_products === "category_collection"} onChange={() => setSettings({ ...settings, returnable_products: "category_collection" })} />
                  Doar din categorii selectate
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Perioadă retur</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input type="number" value={settings.return_window_days} onChange={(e) => setSettings({ ...settings, return_window_days: parseInt(e.target.value) || 0 })} className="w-24" />
                <span className="text-sm text-muted-foreground">zile de la expedierea comenzii (0 = nelimitat)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Opțiuni schimb & anulare</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permite schimbul cu același produs</Label>
                <Switch checked={settings.allow_same_product_exchange} onCheckedChange={(v) => setSettings({ ...settings, allow_same_product_exchange: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite schimbul cu alt produs</Label>
                <Switch checked={settings.allow_different_product_exchange} onCheckedChange={(v) => setSettings({ ...settings, allow_different_product_exchange: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permite anularea comenzii de către client</Label>
                  <p className="text-xs text-muted-foreground">Disponibil cât timp comanda nu a fost expediată</p>
                </div>
                <Switch checked={settings.allow_order_cancellation} onCheckedChange={(v) => setSettings({ ...settings, allow_order_cancellation: v })} />
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 */}
        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Ridicare colet</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(["customer", "merchant", "customer_choice"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input type="radio" checked={settings.courier_pickup === opt} onChange={() => setSettings({ ...settings, courier_pickup: opt })} />
                  {opt === "customer" ? "Clientul" : opt === "merchant" ? "Comerciantul" : "La alegerea clientului"}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Opțiuni rambursare & retur</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permite rambursarea în cont bancar</Label>
                <Switch checked={settings.allow_bank_refund} onCheckedChange={(v) => setSettings({ ...settings, allow_bank_refund: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite multiple cereri de retur pentru aceeași comandă</Label>
                <Switch checked={settings.allow_multiple_returns_per_order} onCheckedChange={(v) => setSettings({ ...settings, allow_multiple_returns_per_order: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Permite retururi parțiale (selectare cantitate)</Label>
                <Switch checked={settings.allow_partial_returns} onCheckedChange={(v) => setSettings({ ...settings, allow_partial_returns: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Footer & Costuri</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Link formular retur în footer</Label>
                <Switch checked={settings.show_footer_link} onCheckedChange={(v) => setSettings({ ...settings, show_footer_link: v })} />
              </div>
              {settings.show_footer_link && (
                <div>
                  <Label>Text link footer</Label>
                  <Input value={settings.footer_link_text} onChange={(e) => setSettings({ ...settings, footer_link_text: e.target.value })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cost transport retur (RON)</Label>
                  <Input type="number" value={settings.return_shipping_cost} onChange={(e) => setSettings({ ...settings, return_shipping_cost: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Cost transport schimb (RON)</Label>
                  <Input type="number" value={settings.exchange_shipping_cost} onChange={(e) => setSettings({ ...settings, exchange_shipping_cost: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 */}
        <TabsContent value="approval" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aprobare automată</CardTitle>
              <CardDescription>Când este activat, cererile de retur sunt aprobate automat la trimitere.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Aprobă automat cererile de retur</Label>
                <Switch checked={settings.auto_approve} onCheckedChange={(v) => setSettings({ ...settings, auto_approve: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 */}
        <TabsContent value="emails" className="space-y-4">
          {/* Created */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificare cerere generată</CardTitle>
                <Switch checked={settings.notify_on_created} onCheckedChange={(v) => setSettings({ ...settings, notify_on_created: v })} />
              </div>
            </CardHeader>
            {settings.notify_on_created && (
              <CardContent className="space-y-2">
                <div><Label>Subiect</Label><Input value={settings.email_created_subject} onChange={(e) => setSettings({ ...settings, email_created_subject: e.target.value })} /></div>
                <div><Label>Corp email</Label><Textarea value={settings.email_created_body} onChange={(e) => setSettings({ ...settings, email_created_body: e.target.value })} rows={4} placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {return_date}, {products_list}, {store_name}" /></div>
              </CardContent>
            )}
          </Card>

          {/* Approved */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificare cerere aprobată</CardTitle>
                <Switch checked={settings.notify_on_approved} onCheckedChange={(v) => setSettings({ ...settings, notify_on_approved: v })} />
              </div>
            </CardHeader>
            {settings.notify_on_approved && (
              <CardContent className="space-y-2">
                <div><Label>Subiect</Label><Input value={settings.email_approved_subject} onChange={(e) => setSettings({ ...settings, email_approved_subject: e.target.value })} /></div>
                <div><Label>Corp email</Label><Textarea value={settings.email_approved_body} onChange={(e) => setSettings({ ...settings, email_approved_body: e.target.value })} rows={4} placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {refund_method}, {store_name}" /></div>
              </CardContent>
            )}
          </Card>

          {/* Rejected */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificare cerere respinsă</CardTitle>
                <Switch checked={settings.notify_on_rejected} onCheckedChange={(v) => setSettings({ ...settings, notify_on_rejected: v })} />
              </div>
            </CardHeader>
            {settings.notify_on_rejected && (
              <CardContent className="space-y-2">
                <div><Label>Subiect</Label><Input value={settings.email_rejected_subject} onChange={(e) => setSettings({ ...settings, email_rejected_subject: e.target.value })} /></div>
                <div><Label>Corp email</Label><Textarea value={settings.email_rejected_body} onChange={(e) => setSettings({ ...settings, email_rejected_body: e.target.value })} rows={4} placeholder="Variabile: {customer_name}, {order_id}, {return_id}, {rejection_reason}, {store_name}" /></div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
