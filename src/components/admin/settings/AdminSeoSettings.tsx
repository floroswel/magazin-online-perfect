import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSeoSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    site_title: "",
    site_description: "",
    og_image: "",
    robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml",
    canonical_url: "",
    google_verification: "",
    schema_org_type: "Store",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "seo_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings((s) => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "seo_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări SEO salvate" });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">SEO Global</h1>
          <p className="text-sm text-muted-foreground">Meta defaults, Open Graph, Schema.org markup.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Titlu site</Label><Input value={settings.site_title} onChange={(e) => setSettings((s) => ({ ...s, site_title: e.target.value }))} placeholder="Magazinul Meu Online" /></div>
            <div><Label>URL Canonic</Label><Input value={settings.canonical_url} onChange={(e) => setSettings((s) => ({ ...s, canonical_url: e.target.value }))} placeholder="https://magazin.ro" /></div>
          </div>
          <div><Label>Descriere site (meta description)</Label><Textarea value={settings.site_description} onChange={(e) => setSettings((s) => ({ ...s, site_description: e.target.value }))} rows={2} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>OG Image URL</Label><Input value={settings.og_image} onChange={(e) => setSettings((s) => ({ ...s, og_image: e.target.value }))} /></div>
            <div><Label>Google Verification</Label><Input value={settings.google_verification} onChange={(e) => setSettings((s) => ({ ...s, google_verification: e.target.value }))} placeholder="google-site-verification=..." /></div>
          </div>
          <div><Label>robots.txt</Label><Textarea value={settings.robots_txt} onChange={(e) => setSettings((s) => ({ ...s, robots_txt: e.target.value }))} rows={4} className="font-mono text-xs" /></div>
        </CardContent>
      </Card>
    </div>
  );
}
