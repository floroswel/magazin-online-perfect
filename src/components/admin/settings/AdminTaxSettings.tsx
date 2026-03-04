import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

interface TaxRate { name: string; rate: number; is_default: boolean; }

const DEFAULTS = {
  prices_include_tax: true,
  display_tax_in_cart: true,
  tax_based_on: "shipping" as "shipping" | "billing" | "store",
  tax_rates: [
    { name: "TVA Standard", rate: 19, is_default: true },
    { name: "TVA Redus", rate: 9, is_default: false },
    { name: "TVA Redus Alimentar", rate: 5, is_default: false },
  ] as TaxRate[],
};

export default function AdminTaxSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "tax_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) setSettings({ ...DEFAULTS, ...(data.value_json as unknown as typeof DEFAULTS) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "tax_settings", value_json: settings as any, description: "Tax/VAT configuration" }, { onConflict: "key" });
    if (error) toast.error(error.message); else toast.success("Setări TVA salvate");
    setSaving(false);
  };

  const addRate = () => {
    setSettings(s => ({ ...s, tax_rates: [...s.tax_rates, { name: "", rate: 0, is_default: false }] }));
  };

  const updateRate = (i: number, field: keyof TaxRate, value: any) => {
    setSettings(s => {
      const rates = [...s.tax_rates];
      rates[i] = { ...rates[i], [field]: value };
      if (field === "is_default" && value) {
        rates.forEach((r, j) => { if (j !== i) r.is_default = false; });
      }
      return { ...s, tax_rates: rates };
    });
  };

  const removeRate = (i: number) => {
    setSettings(s => ({ ...s, tax_rates: s.tax_rates.filter((_, j) => j !== i) }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Taxe (TVA)</CardTitle>
        <Button onClick={save} disabled={saving} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Prețurile includ TVA</Label>
            <Switch checked={settings.prices_include_tax} onCheckedChange={v => setSettings(s => ({ ...s, prices_include_tax: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Afișare TVA separat în coș</Label>
            <Switch checked={settings.display_tax_in_cart} onCheckedChange={v => setSettings(s => ({ ...s, display_tax_in_cart: v }))} />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Cote TVA</h3>
            <Button variant="outline" size="sm" onClick={addRate}><Plus className="h-4 w-4 mr-1" /> Adaugă cotă</Button>
          </div>
          <div className="space-y-3">
            {settings.tax_rates.map((rate, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Input value={rate.name} onChange={e => updateRate(i, "name", e.target.value)} placeholder="Nume cotă" className="flex-1" />
                <div className="flex items-center gap-1 w-24">
                  <Input type="number" value={rate.rate} onChange={e => updateRate(i, "rate", Number(e.target.value))} className="w-16" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={rate.is_default} onCheckedChange={v => updateRate(i, "is_default", v)} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Default</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeRate(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
