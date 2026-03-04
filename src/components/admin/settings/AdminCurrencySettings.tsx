import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface CurrencyItem {
  code: string;
  symbol: string;
  rate: number;
}

interface CurrencySettings {
  default_currency: string;
  currencies: CurrencyItem[];
}

const DEFAULTS: CurrencySettings = {
  default_currency: "RON",
  currencies: [
    { code: "RON", symbol: "lei", rate: 1 },
    { code: "EUR", symbol: "€", rate: 0.2 },
    { code: "USD", symbol: "$", rate: 0.22 },
  ],
};

export default function AdminCurrencySettings() {
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "currency_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) setSettings({ ...DEFAULTS, ...(data.value_json as any) });
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "currency_settings", value_json: settings as any, description: "Multi-currency config" },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message);
    else toast.success("Setări valute salvate!");
    setSaving(false);
  };

  const addCurrency = () => {
    setSettings((s) => ({
      ...s,
      currencies: [...s.currencies, { code: "", symbol: "", rate: 1 }],
    }));
  };

  const updateCurrency = (idx: number, field: keyof CurrencyItem, val: any) => {
    setSettings((s) => ({
      ...s,
      currencies: s.currencies.map((c, i) => (i === idx ? { ...c, [field]: val } : c)),
    }));
  };

  const removeCurrency = (idx: number) => {
    setSettings((s) => ({
      ...s,
      currencies: s.currencies.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Multi-Currency
        </CardTitle>
        <Button onClick={save} disabled={saving} size="sm">
          <Save className="h-4 w-4 mr-1" /> Salvează
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurează valutele disponibile și cursul de schimb. RON este valuta de bază (rate = 1).
        </p>
        <div className="space-y-3">
          {settings.currencies.map((c, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-20">
                <Label className="text-xs">Cod</Label>
                <Input
                  value={c.code}
                  onChange={(e) => updateCurrency(idx, "code", e.target.value.toUpperCase())}
                  placeholder="EUR"
                  maxLength={3}
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">Simbol</Label>
                <Input value={c.symbol} onChange={(e) => updateCurrency(idx, "symbol", e.target.value)} placeholder="€" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Curs (1 RON = ?)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={c.rate}
                  onChange={(e) => updateCurrency(idx, "rate", +e.target.value)}
                />
              </div>
              {c.code !== "RON" && (
                <Button variant="ghost" size="icon" className="text-destructive mt-4" onClick={() => removeCurrency(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addCurrency}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă valută
        </Button>
      </CardContent>
    </Card>
  );
}
