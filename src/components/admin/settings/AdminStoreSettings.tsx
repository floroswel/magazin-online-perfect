import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

const DEFAULTS = {
  products_per_page: 24,
  default_sort: "popular",
  show_stock_quantity: true,
  enable_reviews: true,
  enable_wishlist: true,
  enable_compare: true,
  enable_quick_view: false,
  show_sku: true,
  show_brand: true,
};

export default function AdminStoreSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "store_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json) setSettings({ ...DEFAULTS, ...(data.value_json as typeof DEFAULTS) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "store_settings", value_json: settings as any, description: "Store display settings" }, { onConflict: "key" });
    if (error) toast.error(error.message); else toast.success("Setări salvate");
    setSaving(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Setări Magazin</CardTitle>
        <Button onClick={save} disabled={saving} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Produse pe pagină (default)</Label>
            <Select value={String(settings.products_per_page)} onValueChange={v => set("products_per_page", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="36">36</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sortare implicită</Label>
            <Select value={settings.default_sort} onValueChange={v => set("default_sort", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Cele mai populare</SelectItem>
                <SelectItem value="newest">Cele mai noi</SelectItem>
                <SelectItem value="price-asc">Preț crescător</SelectItem>
                <SelectItem value="price-desc">Preț descrescător</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Funcționalități</h3>
          {[
            ["enable_reviews", "Recenzii produse"],
            ["enable_wishlist", "Lista de dorințe (Wishlist)"],
            ["enable_compare", "Comparare produse"],
            ["enable_quick_view", "Quick View (vizualizare rapidă)"],
            ["show_stock_quantity", "Afișare cantitate stoc"],
            ["show_sku", "Afișare cod produs (SKU)"],
            ["show_brand", "Afișare brand pe card"],
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
