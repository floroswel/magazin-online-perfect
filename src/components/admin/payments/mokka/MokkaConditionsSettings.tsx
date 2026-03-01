import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  settings: any;
  onChange: (patch: any) => void;
}

export default function MokkaConditionsSettings({ settings, onChange }: Props) {
  const { data: courierConfigs = [] } = useQuery({
    queryKey: ["courier-configs"],
    queryFn: async () => {
      const { data } = await supabase.from("courier_configs").select("id, display_name, courier").order("display_name");
      return data || [];
    },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["customer-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const toggleArrayItem = (field: string, id: string) => {
    const arr: string[] = settings[field] || [];
    const next = arr.includes(id) ? arr.filter((x: string) => x !== id) : [...arr, id];
    onChange({ [field]: next });
  };

  const countries = [
    { code: "RO", name: "România" },
    { code: "HU", name: "Ungaria" },
    { code: "BG", name: "Bulgaria" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Condiții Afișare</CardTitle>
        <p className="text-xs text-muted-foreground">
          Metoda de plată va fi vizibilă doar dacă sunt îndeplinite simultan toate condițiile.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shipping methods */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Metode de livrare disponibile</Label>
          <RadioGroup
            value={settings.shipping_methods_type || "all"}
            onValueChange={(v) => onChange({ shipping_methods_type: v })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="ship-all" /><Label htmlFor="ship-all" className="text-sm">Orice metodă de livrare</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="selected" id="ship-sel" /><Label htmlFor="ship-sel" className="text-sm">Doar anumite metode</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="none" id="ship-none" /><Label htmlFor="ship-none" className="text-sm">Nicio metodă</Label></div>
          </RadioGroup>
          {settings.shipping_methods_type === "selected" && (
            <div className="pl-6 space-y-1 mt-2">
              {courierConfigs.map((c: any) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(settings.shipping_methods || []).includes(c.id)}
                    onCheckedChange={() => toggleArrayItem("shipping_methods", c.id)}
                  />
                  {c.display_name}
                </label>
              ))}
              {courierConfigs.length === 0 && <p className="text-xs text-muted-foreground">Nu există curieri configurați.</p>}
            </div>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Disponibilitate în funcție de țară</Label>
          <RadioGroup
            value={settings.country_type || "all"}
            onValueChange={(v) => onChange({ country_type: v })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="co-all" /><Label htmlFor="co-all" className="text-sm">Orice țară</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="selected" id="co-sel" /><Label htmlFor="co-sel" className="text-sm">Doar anumite țări</Label></div>
          </RadioGroup>
          {settings.country_type === "selected" && (
            <div className="pl-6 space-y-1 mt-2">
              {countries.map((c) => (
                <label key={c.code} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(settings.selected_countries || []).includes(c.code)}
                    onCheckedChange={() => toggleArrayItem("selected_countries", c.code)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Customer groups */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Disponibilitate în funcție de grupuri de clienți</Label>
          <RadioGroup
            value={settings.customer_group_type || "all"}
            onValueChange={(v) => onChange({ customer_group_type: v })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="cg-all" /><Label htmlFor="cg-all" className="text-sm">Orice grup</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="selected" id="cg-sel" /><Label htmlFor="cg-sel" className="text-sm">Doar anumite grupuri</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="excluded" id="cg-exc" /><Label htmlFor="cg-exc" className="text-sm">Exclude anumite grupuri</Label></div>
          </RadioGroup>
          {(settings.customer_group_type === "selected" || settings.customer_group_type === "excluded") && (
            <div className="pl-6 space-y-1 mt-2">
              {customerGroups.map((g: any) => {
                const field = settings.customer_group_type === "selected" ? "selected_customer_groups" : "excluded_customer_groups";
                return (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(settings[field] || []).includes(g.id)}
                      onCheckedChange={() => toggleArrayItem(field, g.id)}
                    />
                    {g.name}
                  </label>
                );
              })}
              {customerGroups.length === 0 && <p className="text-xs text-muted-foreground">Nu există grupuri de clienți.</p>}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Disponibilitate în funcție de categorii</Label>
          <RadioGroup
            value={settings.category_type || "all"}
            onValueChange={(v) => onChange({ category_type: v })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="cat-all" /><Label htmlFor="cat-all" className="text-sm">Orice categorie</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="selected" id="cat-sel" /><Label htmlFor="cat-sel" className="text-sm">Doar anumite categorii</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="excluded" id="cat-exc" /><Label htmlFor="cat-exc" className="text-sm">Exclude anumite categorii</Label></div>
          </RadioGroup>
          {(settings.category_type === "selected" || settings.category_type === "excluded") && (
            <div className="pl-6 space-y-1 mt-2 max-h-40 overflow-y-auto">
              {categories.map((c: any) => {
                const field = settings.category_type === "selected" ? "selected_categories" : "excluded_categories";
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(settings[field] || []).includes(c.id)}
                      onCheckedChange={() => toggleArrayItem(field, c.id)}
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Order value */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Disponibilitate în funcție de valoarea comenzii</Label>
          <RadioGroup
            value={settings.order_value_type || "all"}
            onValueChange={(v) => onChange({ order_value_type: v })}
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="ov-all" /><Label htmlFor="ov-all" className="text-sm">Orice valoare</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="range" id="ov-range" /><Label htmlFor="ov-range" className="text-sm">Doar pentru comenzi cu anumite valori</Label></div>
          </RadioGroup>
          {settings.order_value_type === "range" && (
            <div className="pl-6 grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs">Valoare minimă (RON)</Label>
                <Input type="number" value={settings.min_order_value ?? 100} onChange={(e) => onChange({ min_order_value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Valoare maximă (RON)</Label>
                <Input type="number" value={settings.max_order_value ?? 5000} onChange={(e) => onChange({ max_order_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}
        </div>

        {/* IP whitelist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Restricție IP</Label>
              <p className="text-xs text-muted-foreground">Afișează metoda doar pentru anumite IP-uri</p>
            </div>
            <Switch
              checked={settings.ip_whitelist_enabled ?? false}
              onCheckedChange={(checked) => onChange({ ip_whitelist_enabled: checked })}
            />
          </div>
          {settings.ip_whitelist_enabled && (
            <Textarea
              value={(settings.ip_whitelist || []).join("\n")}
              onChange={(e) => onChange({ ip_whitelist: e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean) })}
              placeholder="Un IP pe linie, ex: 192.168.1.1"
              rows={3}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
