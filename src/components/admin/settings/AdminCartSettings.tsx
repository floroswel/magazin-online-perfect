import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCartSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    show_recommendations: true,
    show_recently_viewed: true,
    auto_apply_coupons: false,
    min_order_value: 0,
    free_shipping_threshold: 200,
    max_quantity_per_product: 10,
    show_stock_warning: true,
    cart_expiry_hours: 72,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "cart_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings((s) => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "cart_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări coș salvate" });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Setări Coș de Cumpărături</h1>
          <p className="text-sm text-muted-foreground">Mod afișare, recomandări, limită cantitate.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Comportament coș</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Prag transport gratuit (lei)</Label><Input type="number" value={settings.free_shipping_threshold} onChange={(e) => setSettings((s) => ({ ...s, free_shipping_threshold: +e.target.value }))} /></div>
            <div><Label>Cantitate max per produs</Label><Input type="number" value={settings.max_quantity_per_product} onChange={(e) => setSettings((s) => ({ ...s, max_quantity_per_product: +e.target.value }))} /></div>
            <div><Label>Valoare minimă comandă (lei)</Label><Input type="number" value={settings.min_order_value} onChange={(e) => setSettings((s) => ({ ...s, min_order_value: +e.target.value }))} /></div>
            <div><Label>Expirare coș (ore)</Label><Input type="number" value={settings.cart_expiry_hours} onChange={(e) => setSettings((s) => ({ ...s, cart_expiry_hours: +e.target.value }))} /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Arată recomandări în coș</Label><Switch checked={settings.show_recommendations} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_recommendations: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Arată produse recent vizualizate</Label><Switch checked={settings.show_recently_viewed} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_recently_viewed: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Aplică automat cupoane</Label><Switch checked={settings.auto_apply_coupons} onCheckedChange={(v) => setSettings((s) => ({ ...s, auto_apply_coupons: v }))} /></div>
          <div className="flex items-center justify-between"><Label>Avertisment stoc scăzut</Label><Switch checked={settings.show_stock_warning} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_stock_warning: v }))} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
