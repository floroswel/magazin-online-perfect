import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Monitor, Printer, CreditCard } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  enabled: false,
  terminal_name: "POS Principal",
  location: "",
  sync_stock_realtime: true,
  sync_orders: true,
  print_receipt: true,
  receipt_printer_type: "thermal",
  barcode_scanner: true,
  cash_register: true,
  default_payment_method: "cash",
  tax_included: true,
  offline_mode: false,
};

export default function AdminPOSSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "pos_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "pos_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări POS salvate!");
    setSaving(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Monitor className="w-5 h-5" /> POS (Point of Sale)</h1>
          <p className="text-sm text-muted-foreground">Configurare vânzare la punct fizic cu sincronizare stoc & comenzi.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Monitor className="w-4 h-4" /> Terminal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Activare POS</Label><Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} /></div>
            <div><Label>Nume terminal</Label><Input value={settings.terminal_name} onChange={e => set("terminal_name", e.target.value)} /></div>
            <div><Label>Locație</Label><Input value={settings.location} onChange={e => set("location", e.target.value)} placeholder="Ex: Magazin Centru, București" /></div>
            <div className="flex items-center justify-between"><Label>Mod offline</Label><Switch checked={settings.offline_mode} onCheckedChange={v => set("offline_mode", v)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plăți & Fiscalizare</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Metoda de plată implicită</Label>
              <Select value={settings.default_payment_method} onValueChange={v => set("default_payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Numerar</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mixed">Mixt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>TVA inclus în preț</Label><Switch checked={settings.tax_included} onCheckedChange={v => set("tax_included", v)} /></div>
            <div className="flex items-center justify-between"><Label>Casierie (sertarul de bani)</Label><Switch checked={settings.cash_register} onCheckedChange={v => set("cash_register", v)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimare & Echipamente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Imprimare bon</Label><Switch checked={settings.print_receipt} onCheckedChange={v => set("print_receipt", v)} /></div>
            <div>
              <Label>Tip imprimantă</Label>
              <Select value={settings.receipt_printer_type} onValueChange={v => set("receipt_printer_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Termică (bon)</SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="pdf">PDF digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>Scanner coduri de bare</Label><Switch checked={settings.barcode_scanner} onCheckedChange={v => set("barcode_scanner", v)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Sincronizare</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Sincronizare stoc în timp real</Label><Switch checked={settings.sync_stock_realtime} onCheckedChange={v => set("sync_stock_realtime", v)} /></div>
            <div className="flex items-center justify-between"><Label>Sincronizare comenzi</Label><Switch checked={settings.sync_orders} onCheckedChange={v => set("sync_orders", v)} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
