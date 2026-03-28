import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const pixelProviders = [
  { key: "ga4", name: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", desc: "Urmărire trafic și conversii GA4", category: "analytics" },
  { key: "gtm", name: "Google Tag Manager", placeholder: "GTM-XXXXXXX", desc: "Container GTM pentru toate tag-urile", category: "analytics" },
  { key: "clarity", name: "Microsoft Clarity", placeholder: "abcdef1234", desc: "Heatmaps și înregistrări sesiuni", category: "analytics" },
  { key: "meta_pixel", name: "Meta (Facebook) Pixel", placeholder: "123456789012345", desc: "Urmărire conversii Facebook & Instagram Ads", category: "marketing" },
  { key: "tiktok_pixel", name: "TikTok Pixel", placeholder: "ABCDEFGH12345", desc: "Urmărire conversii TikTok Ads — CRITIC pentru campanii VENTUZA", category: "marketing" },
  { key: "google_ads", name: "Google Ads", placeholder: "AW-123456789", desc: "Urmărire conversii Google Ads", category: "marketing" },
  { key: "pinterest_tag", name: "Pinterest Tag", placeholder: "1234567890", desc: "Urmărire conversii Pinterest Ads", category: "marketing" },
];

export default function AdminPixels() {
  const [configs, setConfigs] = useState<Record<string, { id: string; active: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [pixelRes, integRes] = await Promise.all([
        supabase.from("app_settings").select("*").eq("key", "pixel_tracking").maybeSingle(),
        supabase.from("app_settings").select("*").eq("key", "marketing_integrations").maybeSingle(),
      ]);
      const pixels = (pixelRes.data?.value_json as Record<string, any>) || {};
      const integrations = (integRes.data?.value_json as Record<string, any>) || {};
      // Merge: ga4 can be in integrations as measurement_id or in pixels as id
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
    // Save to both pixel_tracking and marketing_integrations for compatibility
    const pixelData: Record<string, any> = {};
    const integData: Record<string, any> = {};
    for (const p of pixelProviders) {
      const conf = configs[p.key];
      if (!conf) continue;
      pixelData[p.key] = { id: conf.id, active: conf.active };
      // Also write to integrations format
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
      toast({ title: "Configurare salvată", description: "Tracker-ele sunt acum active pe site." });
    }
  };

  const getStatus = (key: string) => {
    const conf = configs[key];
    if (!conf?.id) return { label: "Lipsă ID", color: "bg-destructive" };
    if (!conf.active) return { label: "Inactiv", color: "bg-muted-foreground" };
    return { label: "Activ", color: "bg-green-500" };
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const analyticsProviders = pixelProviders.filter(p => p.category === "analytics");
  const marketingProviders = pixelProviders.filter(p => p.category === "marketing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Eye className="w-5 h-5" /> Tracking & Pixels</h1>
        <p className="text-sm text-muted-foreground">GA4, Meta Pixel, TikTok, GTM, Clarity — toate tracker-ele într-un singur loc. Respectă consimțământul GDPR.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analytics (necesită consimțământ Analytics)</h2>
        <div className="grid gap-3">
          {analyticsProviders.map((p) => {
            const status = getStatus(p.key);
            return (
              <Card key={p.key}>
                <CardContent className="py-4 px-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </Badge>
                    </div>
                    <Switch checked={configs[p.key]?.active || false} onCheckedChange={(checked) => setConfigs({ ...configs, [p.key]: { ...configs[p.key], id: configs[p.key]?.id || "", active: checked } })} />
                  </div>
                  <div>
                    <Label className="text-xs">{p.key === "ga4" ? "Measurement ID" : p.key === "gtm" ? "Container ID" : "Project ID"}</Label>
                    <Input placeholder={p.placeholder} value={configs[p.key]?.id || ""} onChange={e => setConfigs({ ...configs, [p.key]: { ...configs[p.key], active: configs[p.key]?.active || false, id: e.target.value } })} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Marketing Pixels (necesită consimțământ Marketing)</h2>
        <div className="grid gap-3">
          {marketingProviders.map((p) => {
            const status = getStatus(p.key);
            return (
              <Card key={p.key}>
                <CardContent className="py-4 px-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </Badge>
                    </div>
                    <Switch checked={configs[p.key]?.active || false} onCheckedChange={(checked) => setConfigs({ ...configs, [p.key]: { ...configs[p.key], id: configs[p.key]?.id || "", active: checked } })} />
                  </div>
                  <div>
                    <Label className="text-xs">Pixel / Tag ID</Label>
                    <Input placeholder={p.placeholder} value={configs[p.key]?.id || ""} onChange={e => setConfigs({ ...configs, [p.key]: { ...configs[p.key], active: configs[p.key]?.active || false, id: e.target.value } })} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Salvează toate
      </Button>
    </div>
  );
}
