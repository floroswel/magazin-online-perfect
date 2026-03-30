import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, Share2, BarChart3, Settings, Save, Loader2, PauseCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  company: {
    name: "", cui: "", reg_com: "", euipo: "#019130214", iban: "", bank: "", website: "",
    country: "România", county: "", city: "", address: "", postal_code: "",
    phone: "", email: "", email_orders: "", email_support: "", phone_orders: "", order_phone_hours: "",
    show_contact_details: true,
  },
  social: {
    facebook: "", instagram: "", youtube: "", tiktok: "", twitter: "", linkedin: "", pinterest: "",
    facebook_chat: false, whatsapp: false, whatsapp_number: "",
  },
  tracking: {
    google_analytics_id: "", gtm_id: "", google_search_console: "", meta_pixel_id: "", tiktok_pixel_id: "",
    google_ads_id: "", csp_enabled: false,
  },
  store: {
    currency: "RON", language: "ro", timezone: "Europe/Bucharest",
    unit_system: "metric", weight_unit: "kg", dimension_unit: "cm",
    phone_format_international: true,
  },
};

export default function AdminGeneralSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  useEffect(() => { loadSettings(); loadMaintenance(); }, []);

  const loadMaintenance = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "is_maintenance_mode")
      .maybeSingle();
    if (data) setMaintenanceMode(data.value === true);
  };

  const toggleMaintenance = async (value: boolean) => {
    setTogglingMaintenance(true);
    await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", "is_maintenance_mode");
    setMaintenanceMode(value);
    setTogglingMaintenance(false);
    toast.success(value ? "Magazinul este acum în modul mentenanță" : "Magazinul este activ!");
  };

  const loadSettings = async () => {
    const keys = ["company_info", "social_media", "tracking_analytics", "store_settings"];
    const { data } = await supabase.from("app_settings").select("key, value_json").in("key", keys);
    if (data) {
      const map: Record<string, any> = {};
      data.forEach(r => { map[r.key] = r.value_json; });
      setSettings({
        company: { ...DEFAULT_SETTINGS.company, ...(map.company_info || {}) },
        social: { ...DEFAULT_SETTINGS.social, ...(map.social_media || {}) },
        tracking: { ...DEFAULT_SETTINGS.tracking, ...(map.tracking_analytics || {}) },
        store: { ...DEFAULT_SETTINGS.store, ...(map.store_settings || {}) },
      });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const pairs = [
      { key: "company_info", value_json: settings.company },
      { key: "social_media", value_json: settings.social },
      { key: "tracking_analytics", value_json: settings.tracking },
      { key: "store_settings", value_json: settings.store },
    ];

    for (const pair of pairs) {
      await supabase.from("app_settings").upsert(
        { key: pair.key, value_json: pair.value_json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    setSaving(false);
    toast.success("Setări salvate cu succes!");
  };

  const updateCompany = (field: string, value: any) => setSettings(s => ({ ...s, company: { ...s.company, [field]: value } }));
  const updateSocial = (field: string, value: any) => setSettings(s => ({ ...s, social: { ...s.social, [field]: value } }));
  const updateTracking = (field: string, value: any) => setSettings(s => ({ ...s, tracking: { ...s.tracking, [field]: value } }));
  const updateStore = (field: string, value: any) => setSettings(s => ({ ...s, store: { ...s.store, [field]: value } }));

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări Generale</h1>
          <p className="text-sm text-muted-foreground">Configurare companie, social media, tracking și magazin</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se salvează...</> : <><Save className="w-4 h-4 mr-2" /> Salvează</>}
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" /> Companie</TabsTrigger>
          <TabsTrigger value="social" className="gap-2"><Share2 className="w-4 h-4" /> Social Media</TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2"><BarChart3 className="w-4 h-4" /> Tracking & Analytics</TabsTrigger>
          <TabsTrigger value="store" className="gap-2"><Settings className="w-4 h-4" /> Magazin</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Informații Companie</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nume societate</Label><Input value={settings.company.name} onChange={e => updateCompany("name", e.target.value)} placeholder="S.C. Magazin S.R.L." /></div>
                <div><Label>CUI</Label><Input value={settings.company.cui} onChange={e => updateCompany("cui", e.target.value)} placeholder="RO12345678" /></div>
                <div><Label>Nr. Registrul Comerțului (J)</Label><Input value={settings.company.reg_com} onChange={e => updateCompany("reg_com", e.target.value)} placeholder="J40/1234/2024" /></div>
                <div><Label>EUIPO Trademark</Label><Input value={(settings.company as any).euipo || ""} onChange={e => updateCompany("euipo", e.target.value)} placeholder="#019130214" /></div>
                <div><Label>IBAN</Label><Input value={(settings.company as any).iban || ""} onChange={e => updateCompany("iban", e.target.value)} placeholder="RO00XXXX0000000000000000" /></div>
                <div><Label>Bancă</Label><Input value={(settings.company as any).bank || ""} onChange={e => updateCompany("bank", e.target.value)} placeholder="ING Bank" /></div>
                <div><Label>Website</Label><Input value={(settings.company as any).website || ""} onChange={e => updateCompany("website", e.target.value)} placeholder="https://mamalucica.ro" /></div>
                <div><Label>Țara</Label><Input value={settings.company.country} onChange={e => updateCompany("country", e.target.value)} /></div>
                <div><Label>Județ</Label><Input value={settings.company.county} onChange={e => updateCompany("county", e.target.value)} placeholder="București" /></div>
                <div><Label>Oraș</Label><Input value={settings.company.city} onChange={e => updateCompany("city", e.target.value)} placeholder="Sector 1" /></div>
                <div className="md:col-span-2"><Label>Adresă</Label><Input value={settings.company.address} onChange={e => updateCompany("address", e.target.value)} placeholder="Str. Exemplu nr. 1" /></div>
                <div><Label>Cod poștal</Label><Input value={settings.company.postal_code} onChange={e => updateCompany("postal_code", e.target.value)} placeholder="010101" /></div>
                <div><Label>Telefon companie</Label><Input value={settings.company.phone} onChange={e => updateCompany("phone", e.target.value)} placeholder="+40 21 xxx xxxx" /></div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-medium mb-3">Date de contact magazin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Email magazin</Label><Input type="email" value={settings.company.email} onChange={e => updateCompany("email", e.target.value)} placeholder="contact@magazin.ro" /></div>
                  <div><Label>Email comenzi</Label><Input type="email" value={settings.company.email_orders} onChange={e => updateCompany("email_orders", e.target.value)} placeholder="comenzi@magazin.ro" /></div>
                  <div><Label>Email suport</Label><Input type="email" value={settings.company.email_support} onChange={e => updateCompany("email_support", e.target.value)} placeholder="suport@magazin.ro" /></div>
                  <div><Label>Telefon comenzi</Label><Input value={settings.company.phone_orders} onChange={e => updateCompany("phone_orders", e.target.value)} placeholder="+40 7xx xxx xxx" /></div>
                  <div><Label>Program comenzi telefonice</Label><Input value={settings.company.order_phone_hours} onChange={e => updateCompany("order_phone_hours", e.target.value)} placeholder="Luni-Vineri 09:00-18:00" /></div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch checked={settings.company.show_contact_details} onCheckedChange={v => updateCompany("show_contact_details", v)} />
                  <Label>Afișează detalii contact în pagina de contact</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Social Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Facebook</Label><Input value={settings.social.facebook} onChange={e => updateSocial("facebook", e.target.value)} placeholder="https://facebook.com/magazin" /></div>
                <div><Label>Instagram</Label><Input value={settings.social.instagram} onChange={e => updateSocial("instagram", e.target.value)} placeholder="https://instagram.com/magazin" /></div>
                <div><Label>YouTube</Label><Input value={settings.social.youtube} onChange={e => updateSocial("youtube", e.target.value)} placeholder="https://youtube.com/@magazin" /></div>
                <div><Label>TikTok</Label><Input value={settings.social.tiktok} onChange={e => updateSocial("tiktok", e.target.value)} placeholder="https://tiktok.com/@magazin" /></div>
                <div><Label>X (Twitter)</Label><Input value={settings.social.twitter} onChange={e => updateSocial("twitter", e.target.value)} placeholder="https://x.com/magazin" /></div>
                <div><Label>LinkedIn</Label><Input value={settings.social.linkedin} onChange={e => updateSocial("linkedin", e.target.value)} placeholder="https://linkedin.com/company/magazin" /></div>
                <div><Label>Pinterest</Label><Input value={settings.social.pinterest} onChange={e => updateSocial("pinterest", e.target.value)} placeholder="https://pinterest.com/magazin" /></div>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="font-medium">Chat & Messaging</h3>
                <div className="flex items-center gap-2">
                  <Switch checked={settings.social.facebook_chat} onCheckedChange={v => updateSocial("facebook_chat", v)} />
                  <Label>Activează Facebook Messenger Chat</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={settings.social.whatsapp} onCheckedChange={v => updateSocial("whatsapp", v)} />
                  <Label>Activează WhatsApp</Label>
                </div>
                {settings.social.whatsapp && (
                  <div><Label>Număr WhatsApp</Label><Input value={settings.social.whatsapp_number} onChange={e => updateSocial("whatsapp_number", e.target.value)} placeholder="+40 7xx xxx xxx" /></div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Tracking & Analytics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Google Analytics ID</Label><Input value={settings.tracking.google_analytics_id} onChange={e => updateTracking("google_analytics_id", e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
                <div><Label>Google Tag Manager ID</Label><Input value={settings.tracking.gtm_id} onChange={e => updateTracking("gtm_id", e.target.value)} placeholder="GTM-XXXXXXX" /></div>
                <div><Label>Google Search Console</Label><Input value={settings.tracking.google_search_console} onChange={e => updateTracking("google_search_console", e.target.value)} placeholder="Cod verificare" /></div>
                <div><Label>Meta (Facebook) Pixel ID</Label><Input value={settings.tracking.meta_pixel_id} onChange={e => updateTracking("meta_pixel_id", e.target.value)} placeholder="1234567890" /></div>
                <div><Label>TikTok Pixel ID</Label><Input value={settings.tracking.tiktok_pixel_id} onChange={e => updateTracking("tiktok_pixel_id", e.target.value)} placeholder="XXXXXXXXXX" /></div>
                <div><Label>Google Ads ID</Label><Input value={settings.tracking.google_ads_id} onChange={e => updateTracking("google_ads_id", e.target.value)} placeholder="AW-XXXXXXXXX" /></div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={settings.tracking.csp_enabled} onCheckedChange={v => updateTracking("csp_enabled", v)} />
                <Label>Activează Content Security Policy</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Setări Magazin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Monedă</Label>
                  <Select value={settings.store.currency} onValueChange={v => updateStore("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON">RON - Leu românesc</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dolar american</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Limbă</Label>
                  <Select value={settings.store.language} onValueChange={v => updateStore("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fus orar</Label>
                  <Select value={settings.store.timezone} onValueChange={v => updateStore("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Bucharest">Europe/Bucharest (EET)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sistem de măsuri</Label>
                  <Select value={settings.store.unit_system} onValueChange={v => updateStore("unit_system", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={settings.store.phone_format_international} onCheckedChange={v => updateStore("phone_format_international", v)} />
                <Label>Salvează numere de telefon în format internațional (+40)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
