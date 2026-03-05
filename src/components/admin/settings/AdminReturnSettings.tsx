import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, RotateCcw, Save, MapPin } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  return_window_days: 30,
  eligible_statuses: ["delivered"],
  auto_approve: false,
  return_address: { name: "", address: "", city: "", county: "", phone: "" },
  non_returnable_categories: [] as string[],
  return_policy_text: "Aveți dreptul de a returna produsele în termen de 30 de zile de la livrare. Produsele trebuie să fie în ambalajul original, nefolosite și cu toate accesoriile incluse.",
  reminder_days_before: 3,
  failed_retry_days: 3,
};

export default function AdminReturnSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("*")
      .eq("key", "return_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          setSettings({ ...DEFAULT_SETTINGS, ...(data.value_json as any) });
        }
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "return_settings", value_json: settings as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) { toast.error("Eroare la salvare"); return; }
    toast.success("Setări retururi salvate!");
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setSettings(s => ({ ...s, non_returnable_categories: [...s.non_returnable_categories, newCategory.trim()] }));
    setNewCategory("");
  };

  const removeCategory = (cat: string) => {
    setSettings(s => ({ ...s, non_returnable_categories: s.non_returnable_categories.filter(c => c !== cat) }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="w-6 h-6" /> Setări Retururi
        </h1>
        <p className="text-sm text-muted-foreground">Configurare politica de retururi, aprobare automată și adresa de retur</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General settings */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Setări generale</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fereastră de retur (zile după livrare)</Label>
              <Input
                type="number"
                value={settings.return_window_days}
                onChange={(e) => setSettings(s => ({ ...s, return_window_days: parseInt(e.target.value) || 30 }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Aprobare automată</Label>
                <p className="text-xs text-muted-foreground">Cererile de retur vor fi aprobate automat</p>
              </div>
              <Switch
                checked={settings.auto_approve}
                onCheckedChange={(v) => setSettings(s => ({ ...s, auto_approve: v }))}
              />
            </div>

            <div>
              <Label>Statusuri eligibile pentru retur</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {["delivered", "shipped"].map(status => (
                  <Badge
                    key={status}
                    variant={settings.eligible_statuses.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSettings(s => ({
                        ...s,
                        eligible_statuses: s.eligible_statuses.includes(status)
                          ? s.eligible_statuses.filter(st => st !== status)
                          : [...s.eligible_statuses, status],
                      }));
                    }}
                  >
                    {status === "delivered" ? "Livrată" : "Expediată"}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Reminder înainte de reînnoire (zile)</Label>
              <Input
                type="number"
                value={settings.reminder_days_before}
                onChange={(e) => setSettings(s => ({ ...s, reminder_days_before: parseInt(e.target.value) || 3 }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Return address */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Adresa de retur</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Nume / Companie</Label>
              <Input value={settings.return_address.name} onChange={(e) => setSettings(s => ({ ...s, return_address: { ...s.return_address, name: e.target.value } }))} />
            </div>
            <div>
              <Label>Adresă</Label>
              <Input value={settings.return_address.address} onChange={(e) => setSettings(s => ({ ...s, return_address: { ...s.return_address, address: e.target.value } }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Oraș</Label>
                <Input value={settings.return_address.city} onChange={(e) => setSettings(s => ({ ...s, return_address: { ...s.return_address, city: e.target.value } }))} />
              </div>
              <div>
                <Label>Județ</Label>
                <Input value={settings.return_address.county} onChange={(e) => setSettings(s => ({ ...s, return_address: { ...s.return_address, county: e.target.value } }))} />
              </div>
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={settings.return_address.phone} onChange={(e) => setSettings(s => ({ ...s, return_address: { ...s.return_address, phone: e.target.value } }))} />
            </div>
          </CardContent>
        </Card>

        {/* Non-returnable categories */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Categorii nereturnabile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="ex: Alimente, Produse personalizate"
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <Button variant="outline" size="sm" onClick={addCategory}>Adaugă</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {settings.non_returnable_categories.map(cat => (
                <Badge key={cat} variant="secondary" className="cursor-pointer gap-1" onClick={() => removeCategory(cat)}>
                  {cat} ×
                </Badge>
              ))}
              {settings.non_returnable_categories.length === 0 && (
                <p className="text-sm text-muted-foreground">Nicio categorie exclusă.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Return policy text */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Text politică de retur</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              value={settings.return_policy_text}
              onChange={(e) => setSettings(s => ({ ...s, return_policy_text: e.target.value }))}
              placeholder="Textul afișat clientului în formularul de retur..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Se salvează..." : "Salvează setările"}
        </Button>
      </div>
    </div>
  );
}
