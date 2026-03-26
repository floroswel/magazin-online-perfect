import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Wallet, Settings, Filter } from "lucide-react";
import { toast } from "sonner";

export default function AdminWalletSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["wallet-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [form, setForm] = useState({
    enabled: false,
    checkout_display_name: "Plata Wallet",
    delivery_method_restriction: "any",
    allowed_delivery_method_ids: [] as string[],
    usage_mode: "partial",
    condition_countries: { mode: "any", values: [] as string[] },
    condition_customer_groups: { mode: "any", values: [] as string[] },
    condition_categories: { mode: "any", values: [] as string[] },
    condition_min_order_value: "" as string,
    condition_max_order_value: "" as string,
    limit_by_customer_type: false,
    limit_individual_pct: 100,
    limit_legal_pct: 100,
    allowed_ips: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        checkout_display_name: settings.checkout_display_name || "Plata Wallet",
        delivery_method_restriction: settings.delivery_method_restriction || "any",
        allowed_delivery_method_ids: (settings.allowed_delivery_method_ids as any) || [],
        usage_mode: settings.usage_mode || "partial",
        condition_countries: (settings.condition_countries as any) || { mode: "any", values: [] },
        condition_customer_groups: (settings.condition_customer_groups as any) || { mode: "any", values: [] },
        condition_categories: (settings.condition_categories as any) || { mode: "any", values: [] },
        condition_min_order_value: settings.condition_min_order_value != null ? String(settings.condition_min_order_value) : "",
        condition_max_order_value: settings.condition_max_order_value != null ? String(settings.condition_max_order_value) : "",
        limit_by_customer_type: settings.limit_by_customer_type || false,
        limit_individual_pct: settings.limit_individual_pct ?? 100,
        limit_legal_pct: settings.limit_legal_pct ?? 100,
        allowed_ips: settings.allowed_ips || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("No settings row");
      const { error } = await supabase
        .from("wallet_settings" as any)
        .update({
          ...form,
          condition_min_order_value: form.condition_min_order_value ? +form.condition_min_order_value : null,
          condition_max_order_value: form.condition_max_order_value ? +form.condition_max_order_value : null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-settings"] });
      toast.success("Setări wallet salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Setări Portofel Virtual (Wallet)
          </h1>
          <p className="text-sm text-muted-foreground">Configurare globală pentru modulul de wallet</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      {/* Global Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul Wallet Activ</Label>
              <p className="text-sm text-muted-foreground">Activează portofelul virtual pentru toți clienții</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
          </div>
          {form.enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-500 border-green-500/30">✅ Wallet activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ Wallet dezactivat</Badge>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-1" /> Setări generale</TabsTrigger>
          <TabsTrigger value="conditions"><Filter className="w-4 h-4 mr-1" /> Condiții afișare</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-5 mt-4">
          {/* Display Name */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Denumire în checkout</CardTitle></CardHeader>
            <CardContent>
              <Input
                value={form.checkout_display_name}
                onChange={(e) => setForm((f) => ({ ...f, checkout_display_name: e.target.value }))}
                placeholder="Plata Wallet"
              />
              <p className="text-xs text-muted-foreground mt-1">Numele afișat în lista de metode de plată la checkout</p>
            </CardContent>
          </Card>

          {/* Delivery Method Restriction */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Metode de livrare disponibile</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.delivery_method_restriction}
                onValueChange={(v) => setForm((f) => ({ ...f, delivery_method_restriction: v }))}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="any" id="del-any" className="mt-1" />
                  <div>
                    <Label htmlFor="del-any" className="font-medium cursor-pointer">Orice metodă de livrare</Label>
                    <p className="text-xs text-muted-foreground mt-1">Toate metodele de livrare disponibile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="specific" id="del-specific" className="mt-1" />
                  <div>
                    <Label htmlFor="del-specific" className="font-medium cursor-pointer">Doar anumite metode de livrare</Label>
                    <p className="text-xs text-muted-foreground mt-1">Selectează metodele permise</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="none" id="del-none" className="mt-1" />
                  <div>
                    <Label htmlFor="del-none" className="font-medium cursor-pointer">Nicio metodă de livrare</Label>
                    <p className="text-xs text-muted-foreground mt-1">Pentru produse digitale sau ridicare din magazin</p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Usage Mode */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Mod utilizare wallet</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.usage_mode}
                onValueChange={(v) => setForm((f) => ({ ...f, usage_mode: v }))}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="partial" id="usage-partial" className="mt-1" />
                  <div>
                    <Label htmlFor="usage-partial" className="font-medium cursor-pointer">Pentru plăți parțiale</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clientul poate folosi credite wallet pentru a acoperi o parte din valoarea comenzii. Restul se plătește cu altă metodă.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="full_only" id="usage-full" className="mt-1" />
                  <div>
                    <Label htmlFor="usage-full" className="font-medium cursor-pointer">Ca metodă de plată independentă, pentru plăți integrale</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wallet apare doar dacă soldul acoperă integral valoarea comenzii. Nu permite plăți parțiale.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Type Limits */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Limită per tip cont</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Limită diferențiată pe tip cont client</Label>
                  <p className="text-xs text-muted-foreground mt-1">Setează % maxim din comandă plătibil din wallet per tip cont</p>
                </div>
                <Switch
                  checked={form.limit_by_customer_type}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, limit_by_customer_type: v }))}
                />
              </div>
              {form.limit_by_customer_type && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label>Persoane fizice (max %)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.limit_individual_pct}
                      onChange={(e) => setForm((f) => ({ ...f, limit_individual_pct: +e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Persoane juridice (max %)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.limit_legal_pct}
                      onChange={(e) => setForm((f) => ({ ...f, limit_legal_pct: +e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-5 mt-4">
          {/* Country Condition */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de țară</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.condition_countries.mode}
                onValueChange={(v) => setForm((f) => ({ ...f, condition_countries: { ...f.condition_countries, mode: v } }))}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="any" id="country-any" />
                  <Label htmlFor="country-any" className="cursor-pointer">Orice țară</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="country-specific" />
                  <Label htmlFor="country-specific" className="cursor-pointer">Doar anumite țări</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Groups Condition */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de grupuri de clienți</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.condition_customer_groups.mode}
                onValueChange={(v) => setForm((f) => ({ ...f, condition_customer_groups: { ...f.condition_customer_groups, mode: v } }))}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="any" id="group-any" />
                  <Label htmlFor="group-any" className="cursor-pointer">Orice grup de clienți</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="group-specific" />
                  <Label htmlFor="group-specific" className="cursor-pointer">Doar anumite grupuri</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="exclude" id="group-exclude" />
                  <Label htmlFor="group-exclude" className="cursor-pointer">Exclude anumite grupuri</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Category Condition */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de categorii de produse</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup
                value={form.condition_categories.mode}
                onValueChange={(v) => setForm((f) => ({ ...f, condition_categories: { ...f.condition_categories, mode: v } }))}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="any" id="cat-any" />
                  <Label htmlFor="cat-any" className="cursor-pointer">Orice categorie</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="cat-specific" />
                  <Label htmlFor="cat-specific" className="cursor-pointer">Doar anumite categorii</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="exclude" id="cat-exclude" />
                  <Label htmlFor="cat-exclude" className="cursor-pointer">Exclude anumite categorii</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Value Condition */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de valoarea comenzii</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valoare minimă comandă (RON)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.condition_min_order_value}
                    onChange={(e) => setForm((f) => ({ ...f, condition_min_order_value: e.target.value }))}
                    placeholder="Fără minim"
                  />
                </div>
                <div>
                  <Label>Valoare maximă comandă (RON)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.condition_max_order_value}
                    onChange={(e) => setForm((f) => ({ ...f, condition_max_order_value: e.target.value }))}
                    placeholder="Fără maxim"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IP Restriction */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Restricție adresă IP</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Limitează la anumite IP-uri</Label>
                  <p className="text-xs text-muted-foreground mt-1">Util pentru testare sau acces B2B</p>
                </div>
                <Switch
                  checked={!!form.allowed_ips}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, allowed_ips: v ? "" : "" }))}
                />
              </div>
              <Input
                value={form.allowed_ips}
                onChange={(e) => setForm((f) => ({ ...f, allowed_ips: e.target.value }))}
                placeholder="192.168.1.1, 10.0.0.1"
              />
              <p className="text-xs text-muted-foreground">Adrese IP separate prin virgulă. Lasă gol pentru a permite orice IP.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
