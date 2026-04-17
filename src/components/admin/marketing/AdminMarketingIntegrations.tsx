import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, ExternalLink, CheckCircle2, XCircle, TestTube } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type IntegrationConfig = Record<string, any>;

const SETTINGS_KEY = "marketing_integrations";

export default function AdminMarketingIntegrations() {
  const [config, setConfig] = useState<IntegrationConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", SETTINGS_KEY).maybeSingle();
      if (data?.value_json) setConfig(data.value_json as IntegrationConfig);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: SETTINGS_KEY,
      value_json: config as any,
      description: "Marketing integrations config",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurare salvată cu succes!" });
    }
  };

  const update = (section: string, field: string, value: any) => {
    setConfig(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
  };

  const isActive = (section: string) => !!config[section]?.active;
  const hasId = (section: string, field: string = "measurement_id") => !!(config[section]?.[field]);

  const StatusBadge = ({ section, field = "measurement_id" }: { section: string; field?: string }) => (
    isActive(section) && hasId(section, field) ? (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> Conectat</Badge>
    ) : (
      <Badge variant="secondary" className="text-[10px] gap-1"><XCircle className="w-3 h-3" /> Deconectat</Badge>
    )
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">📊 Integrări Marketing</h1>
        <p className="text-sm text-muted-foreground">Google Analytics, Facebook Pixel, TikTok, Pinterest — configurare centralizată.</p>
      </div>

      <Tabs defaultValue="google">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="pinterest">Pinterest</TabsTrigger>
          <TabsTrigger value="ads">Google Ads</TabsTrigger>
          <TabsTrigger value="utm">UTM</TabsTrigger>
        </TabsList>

        {/* ===== GOOGLE ===== */}
        <TabsContent value="google" className="space-y-4 mt-4">
          {/* GA4 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" className="w-5 h-5" alt="" />
                  Google Analytics 4
                  <StatusBadge section="ga4" />
                </CardTitle>
                <Switch checked={isActive("ga4")} onCheckedChange={v => update("ga4", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Measurement ID</Label>
                <Input placeholder="G-XXXXXXXXXX" value={config.ga4?.measurement_id || ""} onChange={e => update("ga4", "measurement_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Evenimente urmărite automat: view_item, view_item_list, add_to_cart, remove_from_cart, begin_checkout, add_payment_info, add_shipping_info, purchase, refund, search.
                Trimise doar după consimțământ cookie (marketing).
              </p>
            </CardContent>
          </Card>

          {/* GTM */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  📦 Google Tag Manager
                  <StatusBadge section="gtm" field="container_id" />
                </CardTitle>
                <Switch checked={isActive("gtm")} onCheckedChange={v => update("gtm", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Container ID</Label>
                <Input placeholder="GTM-XXXXXXX" value={config.gtm?.container_id || ""} onChange={e => update("gtm", "container_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Când GTM este activ, toate evenimentele ecommerce sunt trimise prin dataLayer în loc de gtag direct. GTM are prioritate.
              </p>
            </CardContent>
          </Card>

          {/* Google Search Console */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  🔍 Google Search Console
                  <StatusBadge section="google_search_console" field="verification_code" />
                </CardTitle>
                <Switch checked={isActive("google_search_console")} onCheckedChange={v => update("google_search_console", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Cod de verificare (meta tag content)</Label>
                <Input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={config.google_search_console?.verification_code || ""} onChange={e => update("google_search_console", "verification_code", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Codul va fi injectat automat ca &lt;meta name="google-site-verification"&gt; în head-ul site-ului.
              </p>
            </CardContent>
          </Card>

          {/* Google Shopping */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🛒 Google Shopping Feed
                <Badge className="bg-green-100 text-green-700 text-[10px]">Generat automat</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={`${window.location.origin}/feed/google-shopping.xml`} className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/feed/google-shopping.xml`); toast({ title: "URL copiat" }); }}>Copiază</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Submite acest URL în Google Merchant Center → Products → Feeds → Add feed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== FACEBOOK ===== */}
        <TabsContent value="facebook" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  📘 Facebook Pixel
                  <StatusBadge section="meta_pixel_config" field="pixel_id" />
                </CardTitle>
                <Switch checked={isActive("meta_pixel_config")} onCheckedChange={v => update("meta_pixel_config", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Pixel ID</Label>
                <Input placeholder="123456789012345" value={config.meta_pixel_config?.pixel_id || ""} onChange={e => update("meta_pixel_config", "pixel_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Evenimente: PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, Search, CompleteRegistration. Trimise doar după consimțământ cookie.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  🔒 Facebook Conversions API (Server-Side)
                  <StatusBadge section="fb_capi" field="access_token" />
                </CardTitle>
                <Switch checked={isActive("fb_capi")} onCheckedChange={v => update("fb_capi", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Access Token</Label>
                <Input type="password" placeholder="EAAxxxxxxx..." value={config.fb_capi?.access_token || ""} onChange={e => update("fb_capi", "access_token", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Pixel ID (pentru CAPI)</Label>
                <Input placeholder="123456789012345" value={config.fb_capi?.pixel_id || ""} onChange={e => update("fb_capi", "pixel_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Trimite evenimente server-side via Conversions API pentru acuratețe mai bună (bypass ad blockers).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                📸 Facebook & Instagram Catalog
                <Badge className="bg-green-100 text-green-700 text-[10px]">Generat automat</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={`${window.location.origin}/feed/facebook.xml`} className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/feed/facebook.xml`); toast({ title: "URL copiat" }); }}>Copiază</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Conectează acest feed în Facebook Commerce Manager → Catalog → Data sources.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TIKTOK ===== */}
        <TabsContent value="tiktok" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  🎵 TikTok Pixel
                  <StatusBadge section="tiktok_config" field="pixel_id" />
                </CardTitle>
                <Switch checked={isActive("tiktok_config")} onCheckedChange={v => update("tiktok_config", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Pixel ID</Label>
                <Input placeholder="ABCDEFGH12345" value={config.tiktok_config?.pixel_id || ""} onChange={e => update("tiktok_config", "pixel_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Evenimente: PageView, ViewContent, AddToCart, InitiateCheckout, PlaceAnOrder, CompletePayment. Trimise doar după consimțământ cookie.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PINTEREST ===== */}
        <TabsContent value="pinterest" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  📌 Pinterest Tag
                  <StatusBadge section="pinterest_config" field="tag_id" />
                </CardTitle>
                <Switch checked={isActive("pinterest_config")} onCheckedChange={v => update("pinterest_config", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Tag ID</Label>
                <Input placeholder="1234567890" value={config.pinterest_config?.tag_id || ""} onChange={e => update("pinterest_config", "tag_id", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Evenimente: PageVisit, AddToCart, Checkout. Trimise doar după consimțământ cookie.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== GOOGLE ADS ===== */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  💰 Google Ads Conversion Tracking
                  <StatusBadge section="google_ads_conversion" field="conversion_id" />
                </CardTitle>
                <Switch checked={isActive("google_ads_conversion")} onCheckedChange={v => update("google_ads_conversion", "active", v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Conversion ID</Label>
                <Input placeholder="AW-123456789" value={config.google_ads_conversion?.conversion_id || ""} onChange={e => update("google_ads_conversion", "conversion_id", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Conversion Label</Label>
                <Input placeholder="AbCdEfGhIjKlMnOp" value={config.google_ads_conversion?.label || ""} onChange={e => update("google_ads_conversion", "label", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Evenimentul de conversie se declanșează automat pe pagina de confirmare a comenzii (Thank You Page). Trimite valoarea comenzii pentru Smart Bidding.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== UTM ===== */}
        <TabsContent value="utm" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🔗 UTM Parameter Tracking
                <Badge className="bg-green-100 text-green-700 text-[10px]">Activ automat</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Parametrii UTM sunt capturați automat din URL-uri: <code className="text-xs bg-muted px-1 rounded">utm_source</code>, <code className="text-xs bg-muted px-1 rounded">utm_medium</code>, <code className="text-xs bg-muted px-1 rounded">utm_campaign</code>, <code className="text-xs bg-muted px-1 rounded">utm_content</code>, <code className="text-xs bg-muted px-1 rounded">utm_term</code>.
              </p>
              <p className="text-sm text-muted-foreground">
                Datele sunt salvate în sesiune și atașate automat la comenzi. Poți vedea sursa traficului pe detaliul fiecărei comenzi în Admin → Comenzi.
              </p>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-mono text-muted-foreground">
                  Exemplu URL: https://site.ro/?utm_source=google&utm_medium=cpc&utm_campaign=vara2025
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={save} disabled={saving} className="mt-2">
        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Salvează configurarea
      </Button>
    </div>
  );
}
