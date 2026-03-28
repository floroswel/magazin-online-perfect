import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, UserCheck } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  enable_order_edit: false,
  enable_order_cancel: true,
  enable_delivery_scheduling: false,
  enable_return_portal: true,
  enable_ticket_system: true,
  enable_invoice_download: true,
  enable_reorder: true,
  enable_address_book: true,
  enable_burn_log: true,
  enable_loyalty_dashboard: true,
  enable_wishlist_sharing: true,
  enable_price_alerts: true,
  enable_referral: true,
  enable_gift_cards: true,
  enable_order_tracking: true,
  enable_profile_edit: true,
  enable_password_change: true,
  enable_account_delete: true,
  enable_data_export: true,
};

export default function AdminCustomerPortalSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "customer_portal_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "customer_portal_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări portal client salvate!");
    setSaving(false);
  };

  const features = [
    ["enable_profile_edit", "Editare profil"],
    ["enable_password_change", "Schimbare parolă"],
    ["enable_address_book", "Gestionare adrese"],
    ["enable_order_tracking", "Tracking comenzi"],
    ["enable_order_edit", "Editare comenzi (înainte de procesare)"],
    ["enable_order_cancel", "Anulare comenzi"],
    ["enable_reorder", "Re-comandă (reorder)"],
    ["enable_return_portal", "Portal retururi (RMA)"],
    ["enable_delivery_scheduling", "Programare livrare"],
    ["enable_invoice_download", "Descărcare facturi"],
    ["enable_ticket_system", "Sistem tichete suport"],
    ["enable_subscription_management", "Gestionare abonamente"],
    ["enable_loyalty_dashboard", "Dashboard fidelitate"],
    ["enable_wishlist_sharing", "Partajare wishlist"],
    ["enable_price_alerts", "Alerte de preț"],
    ["enable_referral", "Program recomandări"],
    ["enable_gift_cards", "Carduri cadou"],
    ["enable_data_export", "Export date personale (GDPR)"],
    ["enable_account_delete", "Ștergere cont (GDPR)"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><UserCheck className="w-5 h-5" /> Portal Self-Service Client</h1>
          <p className="text-sm text-muted-foreground">Controlează ce funcționalități sunt disponibile clienților în contul lor.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Funcționalități portal client</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {features.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <Label className="text-sm">{label}</Label>
              <Switch checked={(settings as any)[key]} onCheckedChange={v => setSettings(s => ({ ...s, [key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
