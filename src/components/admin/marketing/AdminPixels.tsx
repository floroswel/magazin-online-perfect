import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, Loader2, CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const pixelProviders = [
  { key: "ga4", name: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", desc: "Urmărire trafic și conversii GA4", category: "analytics", testFn: () => typeof (window as any).gtag === "function" },
  { key: "gtm", name: "Google Tag Manager", placeholder: "GTM-XXXXXXX", desc: "Container GTM pentru toate tag-urile", category: "analytics", testFn: () => !!(window as any).google_tag_manager },
  { key: "clarity", name: "Microsoft Clarity", placeholder: "abcdef1234", desc: "Heatmaps și înregistrări sesiuni", category: "analytics", testFn: () => typeof (window as any).clarity === "function" },
  { key: "meta_pixel", name: "Meta (Facebook) Pixel", placeholder: "123456789012345", desc: "Urmărire conversii Facebook & Instagram Ads", category: "marketing", testFn: () => typeof (window as any).fbq === "function" },
  { key: "tiktok_pixel", name: "TikTok Pixel", placeholder: "ABCDEFGH12345", desc: "Urmărire conversii TikTok Ads — CRITIC pentru campanii MamaLucica", category: "marketing", testFn: () => typeof (window as any).ttq !== "undefined" && (window as any).ttq },
  { key: "google_ads", name: "Google Ads", placeholder: "AW-123456789", desc: "Urmărire conversii Google Ads", category: "marketing", testFn: () => typeof (window as any).gtag === "function" },
  { key: "pinterest_tag", name: "Pinterest Tag", placeholder: "1234567890", desc: "Urmărire conversii Pinterest Ads", category: "marketing", testFn: () => typeof (window as any).pintrk === "function" },
];

export default function AdminPixels() {
  const [configs, setConfigs] = useState<Record<string, { id: string; active: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, "ok" | "fail" | "testing">>({});

  useEffect(() => {
    (async () => {
      const [pixelRes, integRes] = await Promise.all([
        supabase.from("app_settings").select("*").eq("key", "pixel_tracking").maybeSingle(),
        supabase.from("app_settings").select("*").eq("key", "marketing_integrations").maybeSingle(),
      ]);
      const pixels = (pixelRes.data?.value_json as Record<string, any>) || {};
      const integrations = (integRes.data?.value_json as Record<string, any>) || {};
      const merged: Record<string, { id: string; active: boolean }> = {};
      for (const p of pixelProviders) {
        if (pixels[p.key]) {
          merged[p.key] = { id: pixels[p.key].id || "", active: !!pixels[p.key].active };
        } else if (p.key === "ga4" && integrations.ga4) {
          merged[p.key] = { id: integrations.ga4.measurement_id || "", active: integrations.ga4.active !== false };
        } else if (p.key === "gtm" && integrations.gtm) {
          merged[p.key] = { id: integrations.gtm.container_id || "", active: integrations.gtm.active !== false };
        } else if (p.key === "clarity" && integrations.clarity) {
          merged[p.key] = { id: integrations.clarity.project_id || "", active: integrations.clarity.active !== false };
        } else {
          merged[p.key] = { id: "", active: false };
        }
      }
      setConfigs(merged);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const pixelData: Record<string, any> = {};
    const integData: Record<string, any> = {};
    for (const p of pixelProviders) {
      const conf = configs[p.key];
      if (!conf) continue;
      pixelData[p.key] = { id: conf.id, active: conf.active };
      if (p.key === "ga4") integData.ga4 = { measurement_id: conf.id, active: conf.active };
      else if (p.key === "gtm") integData.gtm = { container_id: conf.id, active: conf.active };
      else if (p.key === "clarity") integData.clarity = { project_id: conf.id, active: conf.active };
    }
    const now = new Date().toISOString();
    const [r1, r2] = await Promise.all([
      supabase.from("app_settings").upsert({ key: "pixel_tracking", value_json: pixelData as any, description: "Pixel tracking configuration", updated_at: now }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: "marketing_integrations", value_json: integData as any, description: "Marketing integrations", updated_at: now }, { onConflict: "key" }),
    ]);
    setSaving(false);
    if (r1.error || r2.error) {
      toast({ title: "Eroare la salvare", description: (r1.error || r2.error)?.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Configurare salvată", description: "Pixel-urile active vor fi încărcate pe site după consimțământ GDPR." });
    }
  };

  const handleTest = (key: string) => {
    const provider = pixelProviders.find(p => p.key === key);
    const conf = configs[key];
    if (!conf?.id) {
      toast({ title: "Lipsă ID", description: "Introdu ID-ul pixel-ului înainte de testare.", variant: "destructive" });
      return;
    }
    if (!conf.active) {
      toast({ title: "Pixel inactiv", description: "Activează toggle-ul înainte de testare.", variant: "destructive" });
      return;
    }
    setTestResults(prev => ({ ...prev, [key]: "testing" }));
    // Check after a short delay to allow scripts to load
    setTimeout(() => {
      const loaded = provider?.testFn?.() || false;
      setTestResults(prev => ({ ...prev, [key]: loaded ? "ok" : "fail" }));
      if (loaded) {
        toast({ title: `✅ ${provider?.name}`, description: "Script-ul este încărcat și funcționează." });
      } else {
        toast({ title: `⚠️ ${provider?.name}`, description: "Script-ul NU este detectat. Verifică: 1) Salvat? 2) Consimțământ GDPR acordat? 3) ID corect?", variant: "destructive" });
      }
    }, 1500);
  };

  const getStatus = (key: string) => {
    const conf = configs[key];
    if (!conf?.id) return { label: "Lipsă ID", variant: "destructive" as const, icon: XCircle };
    if (!conf.active) return { label: "Inactiv", variant: "secondary" as const, icon: XCircle };
    return { label: "Activ", variant: "default" as const, icon: CheckCircle2 };
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const analyticsProviders = pixelProviders.filter(p => p.category === "analytics");
  const marketingProviders = pixelProviders.filter(p => p.category === "marketing");

  const renderCard = (p: typeof pixelProviders[0]) => {
    const status = getStatus(p.key);
    const testResult = testResults[p.key];
    return (
      <Card key={p.key} className="border-border/50">
        <CardContent className="py-4 px-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Badge variant={status.variant} className="text-[10px] gap-1 h-5">
                <status.icon className="w-3 h-3" />
                {status.label}
              </Badge>
              {testResult === "ok" && <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] h-5">✓ Verificat</Badge>}
              {testResult === "fail" && <Badge variant="destructive" className="text-[10px] h-5">✗ Nedetectat</Badge>}
            </div>
            <Switch checked={configs[p.key]?.active || false} onCheckedChange={(checked) => setConfigs({ ...configs, [p.key]: { ...configs[p.key], id: configs[p.key]?.id || "", active: checked } })} />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">
                {p.key === "ga4" ? "Measurement ID" : p.key === "gtm" ? "Container ID" : p.key === "clarity" ? "Project ID" : "Pixel / Tag ID"}
              </Label>
              <Input
                placeholder={p.placeholder}
                value={configs[p.key]?.id || ""}
                onChange={e => setConfigs({ ...configs, [p.key]: { ...configs[p.key], active: configs[p.key]?.active || false, id: e.target.value.trim() } })}
                className="font-mono text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest(p.key)}
              disabled={!configs[p.key]?.id || testResult === "testing"}
              className="shrink-0"
            >
              {testResult === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FlaskConical className="w-3.5 h-3.5 mr-1" />}
              Testează
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Eye className="w-5 h-5" /> Tracking & Pixels</h1>
        <p className="text-sm text-muted-foreground">GA4, Meta Pixel, TikTok, GTM, Clarity — toate tracker-ele într-un singur loc. Respectă consimțământul GDPR.</p>
        <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            🔒 <strong>GDPR:</strong> Scripturile Analytics se încarcă doar cu consimțământ <em>Analytics</em>, iar cele Marketing doar cu consimțământ <em>Marketing</em>. Fără consimțământ = zero tracking.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analytics (necesită consimțământ Analytics)</h2>
        <div className="grid gap-3">{analyticsProviders.map(renderCard)}</div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Marketing Pixels (necesită consimțământ Marketing)</h2>
        <div className="grid gap-3">{marketingProviders.map(renderCard)}</div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvează configurarea
      </Button>
    </div>
  );
}
