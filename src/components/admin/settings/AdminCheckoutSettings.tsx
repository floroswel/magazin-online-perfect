import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

const DEFAULTS = {
  guest_checkout: true,
  checkout_type: "one-page",
  require_phone: true,
  require_postal_code: false,
  require_county: true,
  require_company_fields: false,
  show_order_notes: true,
  show_gift_wrap: false,
  terms_required: true,
  newsletter_opt_in: true,
};

export default function AdminCheckoutSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "checkout_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) setSettings({ ...DEFAULTS, ...(data.value_json as typeof DEFAULTS) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "checkout_settings", value_json: settings as any, description: "Checkout configuration" }, { onConflict: "key" });
    if (error) toast.error(error.message); else toast.success("Setări checkout salvate");
    setSaving(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Setări Checkout</CardTitle>
        <Button onClick={save} disabled={saving} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Tip Checkout</Label>
          <Select value={settings.checkout_type} onValueChange={v => set("checkout_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one-page">One Page (o singură pagină)</SelectItem>
              <SelectItem value="multi-step">Multi-step (pași separați)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Opțiuni</h3>
          {[
            ["guest_checkout", "Guest Checkout (fără cont obligatoriu)"],
            ["require_phone", "Telefon obligatoriu"],
            ["require_postal_code", "Cod poștal obligatoriu"],
            ["require_county", "Județ obligatoriu"],
            ["require_company_fields", "Câmpuri firmă (CUI, Reg. Com.) la checkout"],
            ["show_order_notes", "Notițe comandă"],
            ["show_gift_wrap", "Opțiune împachetare cadou"],
            ["terms_required", "Accept T&C obligatoriu"],
            ["newsletter_opt_in", "Opt-in newsletter la checkout"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch checked={(settings as any)[key]} onCheckedChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
