import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Bell, Mail, Smartphone, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    admin_new_order: true,
    admin_low_stock: true,
    admin_low_stock_threshold: 5,
    admin_new_review: true,
    admin_return_request: true,
    admin_new_customer: false,
    admin_failed_payment: true,
    admin_emails: "",
    customer_order_confirmation: true,
    customer_shipping_update: true,
    customer_delivery_confirmation: true,
    customer_review_reminder: false,
    customer_abandoned_cart: true,
    // SMS settings
    sms_enabled: false,
    sms_from_number: "",
    sms_order_confirmation: true,
    sms_shipping_update: true,
    sms_delivery_confirmation: true,
    sms_abandoned_cart: false,
    sms_admin_new_order: false,
    sms_admin_phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "notification_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings((s) => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "notification_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări notificări salvate" });
    setSaving(false);
  };

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: !(s as any)[key] }));
  const set = (key: string, value: any) => setSettings((s) => ({ ...s, [key]: value }));

  const testSms = async () => {
    if (!settings.sms_admin_phone) {
      toast({ title: "Introdu un număr de telefon admin", variant: "destructive" });
      return;
    }
    setTestingSms(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: settings.sms_admin_phone,
          message: "🧪 Test SMS MamaLucica - Notificările SMS funcționează corect!",
          type: "admin_alert",
        },
      });
      if (error) throw error;
      toast({ title: "SMS test trimis cu succes!" });
    } catch (err: any) {
      toast({ title: "Eroare trimitere SMS", description: err.message, variant: "destructive" });
    }
    setTestingSms(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notificări</h1>
          <p className="text-sm text-muted-foreground">Configurare notificări email și SMS — admin și client.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />Notificări Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Adrese email admin (separate prin virgulă)</Label>
            <Input
              value={settings.admin_emails}
              onChange={(e) => set("admin_emails", e.target.value)}
              placeholder="admin@magazin.ro, manager@magazin.ro"
              className="mt-1"
            />
          </div>
          {[
            { key: "admin_new_order", label: "Comandă nouă" },
            { key: "admin_low_stock", label: "Stoc scăzut" },
            { key: "admin_new_review", label: "Review nou" },
            { key: "admin_return_request", label: "Cerere retur" },
            { key: "admin_new_customer", label: "Client nou înregistrat" },
            { key: "admin_failed_payment", label: "Plată eșuată" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <Label>{item.label}</Label>
              <Switch checked={(settings as any)[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
          {settings.admin_low_stock && (
            <div className="flex items-center gap-2 pl-4">
              <Label className="text-xs text-muted-foreground">Prag stoc scăzut:</Label>
              <Input
                type="number"
                value={settings.admin_low_stock_threshold}
                onChange={(e) => set("admin_low_stock_threshold", Number(e.target.value))}
                className="w-20 h-8"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4" />Notificări Email Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "customer_order_confirmation", label: "Confirmare comandă" },
            { key: "customer_shipping_update", label: "Update livrare" },
            { key: "customer_delivery_confirmation", label: "Confirmare livrare" },
            { key: "customer_review_reminder", label: "Reminder review" },
            { key: "customer_abandoned_cart", label: "Coș abandonat" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <Label>{item.label}</Label>
              <Switch checked={(settings as any)[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4" />Notificări SMS (Twilio)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Activează SMS</Label>
            <Switch checked={settings.sms_enabled} onCheckedChange={() => toggle("sms_enabled")} />
          </div>

          {settings.sms_enabled && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Număr Twilio expeditor (format: +40...)</Label>
                <Input
                  value={settings.sms_from_number}
                  onChange={(e) => set("sms_from_number", e.target.value)}
                  placeholder="+40712345678"
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SMS Client automate</p>
                {[
                  { key: "sms_order_confirmation", label: "Confirmare comandă" },
                  { key: "sms_shipping_update", label: "Update livrare / tracking" },
                  { key: "sms_delivery_confirmation", label: "Confirmare livrare" },
                  { key: "sms_abandoned_cart", label: "Recuperare coș abandonat" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label>{item.label}</Label>
                    <Switch checked={(settings as any)[item.key]} onCheckedChange={() => toggle(item.key)} />
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SMS Admin</p>
                <div className="flex items-center justify-between">
                  <Label>SMS la comandă nouă</Label>
                  <Switch checked={settings.sms_admin_new_order} onCheckedChange={() => toggle("sms_admin_new_order")} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefon admin (pentru SMS comandă nouă + test)</Label>
                  <Input
                    value={settings.sms_admin_phone}
                    onChange={(e) => set("sms_admin_phone", e.target.value)}
                    placeholder="+40712345678"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={testSms} disabled={testingSms} className="w-full">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {testingSms ? "Se trimite..." : "Trimite SMS test"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
