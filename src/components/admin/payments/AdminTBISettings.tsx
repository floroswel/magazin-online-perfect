import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Landmark, KeyRound, Package, Eye, Filter, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

const TBI_PRODUCTS = [
  "BNPL V1", "BNPL V3", "Standard V1", "Standard V2", "Standard V3",
  "Promo V1", "Promo V2", "Promo V3", "Promo V4",
  "RFD V1", "RFD V2", "PROMO_Green",
];

export default function AdminTBISettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["tbi-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tbi_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        ...settings,
        enabled_products: (settings.enabled_products as any) || ["BNPL V1"],
        condition_countries: (settings.condition_countries as any) || { mode: "any", values: [] },
        condition_customer_groups: (settings.condition_customer_groups as any) || { mode: "any", values: [] },
        condition_categories: (settings.condition_categories as any) || { mode: "any", values: [] },
        allowed_delivery_ids: (settings.allowed_delivery_ids as any) || [],
        min_order_value: settings.min_order_value ?? 100,
        max_order_value: settings.max_order_value ?? "",
      });
    }
  }, [settings]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("No settings row");
      const products = form.enabled_products || [];
      if (form.enabled && products.length === 0) throw new Error("Selectează cel puțin un serviciu de plată.");
      if (form.enabled && !form.username) throw new Error("Username obligatoriu.");
      if (form.enabled && !form.password) throw new Error("Parola obligatorie.");
      if (form.enabled && !form.store_id) throw new Error("ID Magazin obligatoriu.");

      const payload: any = {
        enabled: form.enabled,
        username: form.username,
        password: form.password,
        store_id: form.store_id,
        demo_mode: form.demo_mode,
        sftl_public_key: form.sftl_public_key,
        merchant_public_key: form.merchant_public_key,
        enabled_products: form.enabled_products,
        checkout_display_name: form.checkout_display_name,
        show_snippet: form.show_snippet,
        show_footer_icon: form.show_footer_icon,
        delivery_restriction: form.delivery_restriction,
        allowed_delivery_ids: form.allowed_delivery_ids,
        condition_countries: form.condition_countries,
        condition_customer_groups: form.condition_customer_groups,
        condition_categories: form.condition_categories,
        min_order_value: Math.max(100, form.min_order_value || 100),
        max_order_value: form.max_order_value ? +form.max_order_value : null,
        limit_by_customer_type: form.limit_by_customer_type,
        limit_individual_pct: form.limit_individual_pct,
        limit_legal_pct: form.limit_legal_pct,
        allowed_ips: form.allowed_ips || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("tbi_settings" as any).update(payload as any).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tbi-settings"] });
      toast.success("Setări TBI Bank salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleProduct = (product: string) => {
    const current = form?.enabled_products || [];
    const updated = current.includes(product)
      ? current.filter((p: string) => p !== product)
      : [...current, product];
    update("enabled_products", updated);
  };

  if (isLoading || !form) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" /> TBI Bank — Plată în Rate
          </h1>
          <p className="text-sm text-muted-foreground">Configurare integrare TBI Bank pentru plăți în rate</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      {/* Demo mode banner */}
      {form.demo_mode && form.enabled && (
        <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">Modul Demo activ — tranzacțiile nu sunt reale</span>
        </div>
      )}

      {/* Global Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul TBI Bank Activ</Label>
              <p className="text-sm text-muted-foreground">Activează plata în rate prin TBI Bank la checkout</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>
          {form.enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-600 border-green-500/30">✅ TBI Bank activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ TBI Bank dezactivat</Badge>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="connection">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="connection"><KeyRound className="w-4 h-4 mr-1" /> Conectare</TabsTrigger>
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" /> Servicii</TabsTrigger>
          <TabsTrigger value="display"><Eye className="w-4 h-4 mr-1" /> Afișare</TabsTrigger>
          <TabsTrigger value="conditions"><Filter className="w-4 h-4 mr-1" /> Condiții</TabsTrigger>
        </TabsList>

        {/* TAB 1: Connection */}
        <TabsContent value="connection" className="space-y-5 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Credențiale TBI Bank</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nume utilizator (Username) *</Label>
                <Input value={form.username || ""} onChange={(e) => update("username", e.target.value)} placeholder="username_tbi" />
              </div>
              <div>
                <Label>Parolă (Password) *</Label>
                <Input type="password" value={form.password || ""} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <Label>ID Magazin (providerCode) *</Label>
                <Input value={form.store_id || ""} onChange={(e) => update("store_id", e.target.value)} placeholder="merchant_ro" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Activează modul Demo (UAT)</Label>
                  <p className="text-xs text-muted-foreground mt-1">Folosește endpoint-ul de test TBI</p>
                </div>
                <Switch checked={form.demo_mode} onCheckedChange={(v) => update("demo_mode", v)} />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Endpoint-uri API:</p>
                <p>Demo: vmrouatftos01.westeurope.cloudapp.azure.com/LoanApplication/Finalize</p>
                <p>Live: ecommerce.tbibank.ro/Api/LoanApplication/Finalize</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Chei RSA de Criptare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SFTL Public Key (criptare cereri către TBI)</Label>
                {form.sftl_public_key ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Cheie configurată</Badge>
                    <Button variant="ghost" size="sm" onClick={() => update("sftl_public_key", "")}>Schimbă</Button>
                  </div>
                ) : (
                  <Textarea value="" onChange={(e) => update("sftl_public_key", e.target.value)} placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" rows={4} className="mt-1 font-mono text-xs" />
                )}
              </div>
              <div>
                <Label>Merchant Public Key (decriptare callback-uri TBI)</Label>
                {form.merchant_public_key ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Cheie configurată</Badge>
                    <Button variant="ghost" size="sm" onClick={() => update("merchant_public_key", "")}>Schimbă</Button>
                  </div>
                ) : (
                  <Textarea value="" onChange={(e) => update("merchant_public_key", e.target.value)} placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" rows={4} className="mt-1 font-mono text-xs" />
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p>Pentru a obține credențialele TBI contactați echipa de integrare TBI Bank la <span className="font-medium text-foreground">parteneri@tbibank.ro</span></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Financial Products */}
        <TabsContent value="products" className="space-y-5 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Servicii de Plată Activate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-400 mb-4">
                <Info className="w-4 h-4 inline mr-1" />
                Pentru utilizarea anumitor servicii este necesar să contactați mai întâi procesatorul TBI în vederea activării.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TBI_PRODUCTS.map((product) => {
                  const checked = (form.enabled_products || []).includes(product);
                  return (
                    <label key={product} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleProduct(product)} />
                      <span className="text-sm font-medium">{product}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Cel puțin un serviciu trebuie selectat pentru a activa modulul.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Display Preferences */}
        <TabsContent value="display" className="space-y-5 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Preferințe Afișare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Denumire afișată în checkout</Label>
                <Input value={form.checkout_display_name || ""} onChange={(e) => update("checkout_display_name", e.target.value)} placeholder="Plată în rate prin TBI Bank" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Activează snippet site</Label>
                  <p className="text-xs text-muted-foreground mt-1">Afișează widget TBI pe paginile de produs și coș</p>
                </div>
                <Switch checked={form.show_snippet} onCheckedChange={(v) => update("show_snippet", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Afișează pictogramă în footer</Label>
                  <p className="text-xs text-muted-foreground mt-1">Logo TBI Bank în secțiunea metode de plată din footer</p>
                </div>
                <Switch checked={form.show_footer_icon} onCheckedChange={(v) => update("show_footer_icon", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Metode de livrare disponibile</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.delivery_restriction} onValueChange={(v) => update("delivery_restriction", v)} className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="any" id="tbi-del-any" className="mt-1" />
                  <div>
                    <Label htmlFor="tbi-del-any" className="font-medium cursor-pointer">Orice metodă de livrare</Label>
                    <p className="text-xs text-muted-foreground mt-1">Toate metodele disponibile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="specific" id="tbi-del-specific" className="mt-1" />
                  <div>
                    <Label htmlFor="tbi-del-specific" className="font-medium cursor-pointer">Doar anumite metode de livrare</Label>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="none" id="tbi-del-none" className="mt-1" />
                  <div>
                    <Label htmlFor="tbi-del-none" className="font-medium cursor-pointer">Nicio metodă de livrare</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Display Conditions */}
        <TabsContent value="conditions" className="space-y-5 mt-4">
          {/* Country */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de țară</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_countries?.mode || "any"} onValueChange={(v) => update("condition_countries", { ...form.condition_countries, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="tbi-country-any" /><Label htmlFor="tbi-country-any" className="cursor-pointer">Orice țară</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="tbi-country-specific" /><Label htmlFor="tbi-country-specific" className="cursor-pointer">Doar anumite țări (România, Bulgaria, Germania, Danemarca, Polonia)</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Groups */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de grupuri de clienți</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_customer_groups?.mode || "any"} onValueChange={(v) => update("condition_customer_groups", { ...form.condition_customer_groups, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="tbi-grp-any" /><Label htmlFor="tbi-grp-any" className="cursor-pointer">Orice grup de clienți</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="tbi-grp-specific" /><Label htmlFor="tbi-grp-specific" className="cursor-pointer">Doar anumite grupuri</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="tbi-grp-exclude" /><Label htmlFor="tbi-grp-exclude" className="cursor-pointer">Exclude anumite grupuri</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de categorii de produse</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_categories?.mode || "any"} onValueChange={(v) => update("condition_categories", { ...form.condition_categories, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="tbi-cat-any" /><Label htmlFor="tbi-cat-any" className="cursor-pointer">Orice categorie</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="tbi-cat-specific" /><Label htmlFor="tbi-cat-specific" className="cursor-pointer">Doar anumite categorii</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="tbi-cat-exclude" /><Label htmlFor="tbi-cat-exclude" className="cursor-pointer">Exclude anumite categorii</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Value */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de valoarea comenzii</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valoare minimă (RON) — min 100</Label>
                  <Input type="number" min={100} value={form.min_order_value ?? 100} onChange={(e) => update("min_order_value", Math.max(100, +e.target.value))} />
                </div>
                <div>
                  <Label>Valoare maximă (RON)</Label>
                  <Input type="number" min={0} value={form.max_order_value ?? ""} onChange={(e) => update("max_order_value", e.target.value ? +e.target.value : null)} placeholder="Fără maxim" />
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Metoda de plată este ascunsă automat dacă valoarea coșului &lt; 100 RON (limita minimă TBI obligatorie).
              </div>
            </CardContent>
          </Card>

          {/* Customer Type Limit */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Limită per tip cont client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Limită diferențiată pe tip cont</Label>
                <Switch checked={form.limit_by_customer_type} onCheckedChange={(v) => update("limit_by_customer_type", v)} />
              </div>
              {form.limit_by_customer_type && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><Label>Persoane fizice (max %)</Label><Input type="number" min={0} max={100} value={form.limit_individual_pct ?? 100} onChange={(e) => update("limit_individual_pct", +e.target.value)} /></div>
                  <div><Label>Persoane juridice (max %)</Label><Input type="number" min={0} max={100} value={form.limit_legal_pct ?? 100} onChange={(e) => update("limit_legal_pct", +e.target.value)} /></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IP Restriction */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Restricție adresă IP</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={form.allowed_ips || ""} onChange={(e) => update("allowed_ips", e.target.value)} placeholder="192.168.1.1, 10.0.0.1" />
              <p className="text-xs text-muted-foreground">Adrese IP separate prin virgulă. Lasă gol pentru orice IP.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
