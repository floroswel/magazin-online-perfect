import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  settings: any;
  onChange: (patch: any) => void;
}

const termOptions = [
  { value: "3", label: "3 luni" },
  { value: "6", label: "6 luni" },
  { value: "12", label: "12 luni" },
];

export default function MokkaDisplaySettings({ settings, onChange }: Props) {
  const acceptedTerms: string[] = settings.accepted_terms || ["3"];

  const toggleTerm = (value: string) => {
    const next = acceptedTerms.includes(value)
      ? acceptedTerms.filter((t: string) => t !== value)
      : [...acceptedTerms, value];
    onChange({ accepted_terms: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferințe Afișare</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Activează snippet site</p>
            <p className="text-xs text-muted-foreground">Afișează prețul portocaliu Mokka în paginile de produs</p>
          </div>
          <Switch
            checked={settings.enabled_snippet ?? true}
            onCheckedChange={(checked) => onChange({ enabled_snippet: checked })}
          />
        </div>

        <div>
          <Label>Rate acceptate</Label>
          <div className="flex gap-4 mt-2">
            {termOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={acceptedTerms.includes(opt.value)}
                  onCheckedChange={() => toggleTerm(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Dobândă (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.interest_rate ?? 0}
              onChange={(e) => onChange({ interest_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Procent comision (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.commission_rate ?? 0}
              onChange={(e) => onChange({ commission_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <Label>Denumire afișată la checkout</Label>
          <Input
            value={settings.checkout_label || "Credit Online - Mokka"}
            onChange={(e) => onChange({ checkout_label: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Pictogramă footer</p>
            <p className="text-xs text-muted-foreground">Afișează sigla Mokka în zona de footer</p>
          </div>
          <Switch
            checked={settings.show_footer_icon ?? true}
            onCheckedChange={(checked) => onChange({ show_footer_icon: checked })}
          />
        </div>

        <div>
          <Label>Ordine afișare în lista de plăți</Label>
          <Input
            type="number"
            value={settings.sort_order ?? 5}
            onChange={(e) => onChange({ sort_order: parseInt(e.target.value) || 0 })}
            className="max-w-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">Cu cât numărul e mai mic, cu atât mai sus apare.</p>
        </div>
      </CardContent>
    </Card>
  );
}
