import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Wallet, KeyRound, Eye, Filter, AlertTriangle, Info, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPayPoSettings() {
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["paypo-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paypo_settings" as any)
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
        condition_countries: (settings.condition_countries as any) || { mode: "any", values: [] },
        condition_customer_groups: (settings.condition_customer_groups as any) || { mode: "any", values: [] },
        condition_categories: (settings.condition_categories as any) || { mode: "any", values: [] },
        allowed_delivery_ids: (settings.allowed_delivery_ids as any) || [],
        min_order_value: settings.min_order_value ?? 50,
        max_order_value: settings.max_order_value ?? 800,
      });
    }
  }, [settings]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("No settings row");
      if (form.enabled && !form.client_id) throw new Error("Client ID obligatoriu.");
      if (form.enabled && !form.client_secret) throw new Error("Client Secret obligatoriu.");

      const payload: any = {
        enabled: form.enabled,
        client_id: form.client_id,
        client_secret: form.client_secret,
        currency: form.currency,
        demo_mode: form.demo_mode,
        show_snippet: form.show_snippet,
        checkout_display_name: form.checkout_display_name,
        show_footer_icon: form.show_footer_icon,
        delivery_restriction: form.delivery_restriction,
        allowed_delivery_ids: form.allowed_delivery_ids,
        condition_countries: form.condition_countries,
        condition_customer_groups: form.condition_customer_groups,
        condition_categories: form.condition_categories,
        min_order_value: Math.max(50, form.min_order_value || 50),
        max_order_value: Math.min(800, form.max_order_value || 800),
        limit_by_customer_type: form.limit_by_customer_type,
        limit_individual_pct: form.limit_individual_pct,
        limit_legal_pct: form.limit_legal_pct,
        allowed_ips: form.allowed_ips || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("paypo_settings" as any).update(payload as any).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paypo-settings"] });
      toast.success("Setări PayPo salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  const testConnection = async () => {
    if (!form.client_id || !form.client_secret) {
      toast.error("Completează Client ID și Client Secret.");
      return;
    }
    setTestingConnection(true);
    try {
      const baseUrl = form.demo_mode
        ? "https://api.sandbox.paypo.pl/v3"
        : "https://api.paypo.ro/v3";

      const res = await fetch(`${baseUrl}/oauth/tokens`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: form.client_id,
          client_secret: form.client_secret,
        }),
      });

      if (res.ok) {
        toast.success("✅ Conexiune PayPo reușită! Token obținut cu succes.");
      } else {
        const err = await res.text();
        toast.error(`❌ Eroare conexiune PayPo: ${res.status} — ${err}`);
      }
    } catch (e: any) {
      toast.error(`❌ Eroare: ${e.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  if (isLoading || !form) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> PayPo — Cumpără acum, plătești în 30 de zile
          </h1>
          <p className="text-sm text-muted-foreground">Configurare integrare PayPo BNPL</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      {form.demo_mode && form.enabled && (
        <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">Modul Demo activ — sandbox PayPo</span>
        </div>
      )}

      {/* Global Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Modul PayPo Activ</Label>
              <p className="text-sm text-muted-foreground">Activează plata PayPo BNPL la checkout</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>
          {form.enabled ? (
            <Badge className="mt-3 bg-green-500/15 text-green-600 border-green-500/30">✅ PayPo activ</Badge>
          ) : (
            <Badge variant="secondary" className="mt-3">⏸️ PayPo dezactivat</Badge>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="connection">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="connection"><KeyRound className="w-4 h-4 mr-1" /> Conectare</TabsTrigger>
          <TabsTrigger value="display"><Eye className="w-4 h-4 mr-1" /> Afișare</TabsTrigger>
          <TabsTrigger value="conditions"><Filter className="w-4 h-4 mr-1" /> Condiții</TabsTrigger>
        </TabsList>

        {/* TAB 1: Connection */}
        <TabsContent value="connection" className="space-y-5 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Credențiale PayPo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ID (Client ID / shopId) *</Label>
                <Input value={form.client_id || ""} onChange={(e) => update("client_id", e.target.value)} placeholder="shop_id_paypo" />
              </div>
              <div>
                <Label>Token (Client Secret) *</Label>
                <Input type="password" value={form.client_secret || ""} onChange={(e) => update("client_secret", e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <Label>Monedă procesare tranzacție</Label>
                <Select value={form.currency || "RON"} onValueChange={(v) => update("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RON">RON (moneda comenzii)</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Activează modul Demo (Sandbox)</Label>
                  <p className="text-xs text-muted-foreground mt-1">Folosește endpoint-ul sandbox PayPo</p>
                </div>
                <Switch checked={form.demo_mode} onCheckedChange={(v) => update("demo_mode", v)} />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Endpoint-uri API:</p>
                <p>Sandbox: api.sandbox.paypo.pl/v3/</p>
                <p>Producție: api.paypo.ro/v3/</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={testConnection} disabled={testingConnection}>
                  {testingConnection ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Testează Conexiunea
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://paypo.ro/p/comercianti/integrare/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Documentație PayPo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Display Preferences */}
        <TabsContent value="display" className="space-y-5 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Preferințe Afișare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Denumire afișată în checkout</Label>
                <Input value={form.checkout_display_name || ""} onChange={(e) => update("checkout_display_name", e.target.value)} placeholder="PayPo — Cumpără acum, plătești în 30 de zile" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Activează snippet site</Label>
                  <p className="text-xs text-muted-foreground mt-1">Widget PayPo pe paginile de produs și coș</p>
                </div>
                <Switch checked={form.show_snippet} onCheckedChange={(v) => update("show_snippet", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Afișează pictogramă în footer</Label>
                  <p className="text-xs text-muted-foreground mt-1">Logo PayPo în secțiunea metode de plată din footer</p>
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
                  <RadioGroupItem value="any" id="pp-del-any" className="mt-1" />
                  <Label htmlFor="pp-del-any" className="font-medium cursor-pointer">Orice metodă de livrare</Label>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="specific" id="pp-del-specific" className="mt-1" />
                  <Label htmlFor="pp-del-specific" className="font-medium cursor-pointer">Doar anumite metode de livrare</Label>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="none" id="pp-del-none" className="mt-1" />
                  <Label htmlFor="pp-del-none" className="font-medium cursor-pointer">Nicio metodă de livrare</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Display Conditions */}
        <TabsContent value="conditions" className="space-y-5 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de țară</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_countries?.mode || "any"} onValueChange={(v) => update("condition_countries", { ...form.condition_countries, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="pp-country-any" /><Label htmlFor="pp-country-any" className="cursor-pointer">Orice țară</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="pp-country-specific" /><Label htmlFor="pp-country-specific" className="cursor-pointer">Doar anumite țări</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de grupuri de clienți</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_customer_groups?.mode || "any"} onValueChange={(v) => update("condition_customer_groups", { ...form.condition_customer_groups, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="pp-grp-any" /><Label htmlFor="pp-grp-any" className="cursor-pointer">Orice grup de clienți</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="pp-grp-specific" /><Label htmlFor="pp-grp-specific" className="cursor-pointer">Doar anumite grupuri</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="pp-grp-exclude" /><Label htmlFor="pp-grp-exclude" className="cursor-pointer">Exclude anumite grupuri</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de categorii de produse</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={form.condition_categories?.mode || "any"} onValueChange={(v) => update("condition_categories", { ...form.condition_categories, mode: v })} className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="pp-cat-any" /><Label htmlFor="pp-cat-any" className="cursor-pointer">Orice categorie</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="pp-cat-specific" /><Label htmlFor="pp-cat-specific" className="cursor-pointer">Doar anumite categorii</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="pp-cat-exclude" /><Label htmlFor="pp-cat-exclude" className="cursor-pointer">Exclude anumite categorii</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Disponibilitate în funcție de valoarea comenzii</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valoare minimă (RON) — min 50</Label>
                  <Input type="number" min={50} value={form.min_order_value ?? 50} onChange={(e) => update("min_order_value", Math.max(50, +e.target.value))} />
                </div>
                <div>
                  <Label>Valoare maximă (RON) — max 800</Label>
                  <Input type="number" max={800} value={form.max_order_value ?? 800} onChange={(e) => update("max_order_value", Math.min(800, +e.target.value || 800))} />
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Metoda de plată este ascunsă automat dacă valoarea coșului &lt; 50 RON sau &gt; 800 RON (limite PayPo obligatorii).
              </div>
            </CardContent>
          </Card>

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
