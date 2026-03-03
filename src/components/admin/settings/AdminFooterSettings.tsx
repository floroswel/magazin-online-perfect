import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2, Facebook, Instagram, Youtube, Truck, CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";

interface SocialLink { platform: string; url: string; icon: string }
interface PaymentMethod { name: string; image: string }
interface DeliveryPartner { name: string; url: string; image: string }
interface CompanyInfo {
  company_name: string; cui: string; reg_com: string; address: string;
  working_hours: string; app_store_url?: string; google_play_url?: string;
}

const SOCIAL_ICONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];

export default function AdminFooterSettings() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: "", cui: "", reg_com: "", address: "", working_hours: "",
    app_store_url: "", google_play_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", ["footer_social_links", "footer_payment_methods", "footer_delivery_partners", "footer_company_info"])
      .then(({ data }) => {
        data?.forEach(row => {
          const val = row.value_json;
          switch (row.key) {
            case "footer_social_links":
              if (Array.isArray(val)) setSocialLinks(val as unknown as SocialLink[]);
              break;
            case "footer_payment_methods":
              if (Array.isArray(val)) setPaymentMethods(val as unknown as PaymentMethod[]);
              break;
            case "footer_delivery_partners":
              if (Array.isArray(val)) setDeliveryPartners(val as unknown as DeliveryPartner[]);
              break;
            case "footer_company_info":
              if (val && typeof val === "object" && !Array.isArray(val)) setCompanyInfo(val as unknown as CompanyInfo);
              break;
          }
        });
        setLoading(false);
      });
  }, []);

  const saveSection = async (key: string, value: any) => {
    setSaving(key);
    await supabase.from("app_settings").upsert(
      { key, value_json: value as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(null);
    toast.success("Salvat cu succes!");
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Setări Footer</h1>
        <p className="text-sm text-muted-foreground">Configurează social media, metode de plată, curieri și datele firmei</p>
      </div>

      <Tabs defaultValue="social" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="social"><Facebook className="w-4 h-4 mr-1.5" /> Social</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-1.5" /> Plăți</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="w-4 h-4 mr-1.5" /> Livrare</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-1.5" /> Firmă</TabsTrigger>
        </TabsList>

        {/* Social Media */}
        <TabsContent value="social" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Link-uri Social Media</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSocialLinks(prev => [...prev, { platform: "", url: "", icon: "facebook" }])}>
                <Plus className="w-4 h-4 mr-1" /> Adaugă
              </Button>
              <Button size="sm" onClick={() => saveSection("footer_social_links", socialLinks)} disabled={saving === "footer_social_links"}>
                {saving === "footer_social_links" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
              </Button>
            </div>
          </div>
          {socialLinks.map((link, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-xs">Platformă</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={link.icon}
                      onChange={e => {
                        const icon = e.target.value;
                        const label = SOCIAL_ICONS.find(s => s.value === icon)?.label || "";
                        setSocialLinks(prev => prev.map((l, idx) => idx === i ? { ...l, icon, platform: label } : l));
                      }}
                    >
                      {SOCIAL_ICONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">URL</Label>
                    <Input value={link.url} onChange={e => setSocialLinks(prev => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))} placeholder="https://facebook.com/..." />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSocialLinks(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Metode de Plată</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPaymentMethods(prev => [...prev, { name: "", image: "" }])}>
                <Plus className="w-4 h-4 mr-1" /> Adaugă
              </Button>
              <Button size="sm" onClick={() => saveSection("footer_payment_methods", paymentMethods)} disabled={saving === "footer_payment_methods"}>
                {saving === "footer_payment_methods" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
              </Button>
            </div>
          </div>
          {paymentMethods.map((method, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label className="text-xs">Nume</Label>
                    <Input value={method.name} onChange={e => setPaymentMethods(prev => prev.map((m, idx) => idx === i ? { ...m, name: e.target.value } : m))} placeholder="Visa" />
                  </div>
                  <div>
                    <Label className="text-xs">URL imagine/icon</Label>
                    <Input value={method.image} onChange={e => setPaymentMethods(prev => prev.map((m, idx) => idx === i ? { ...m, image: e.target.value } : m))} placeholder="/images/payments/visa.svg" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPaymentMethods(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Delivery Partners */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Parteneri de Livrare</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeliveryPartners(prev => [...prev, { name: "", url: "", image: "" }])}>
                <Plus className="w-4 h-4 mr-1" /> Adaugă
              </Button>
              <Button size="sm" onClick={() => saveSection("footer_delivery_partners", deliveryPartners)} disabled={saving === "footer_delivery_partners"}>
                {saving === "footer_delivery_partners" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
              </Button>
            </div>
          </div>
          {deliveryPartners.map((partner, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-xs">Nume</Label>
                    <Input value={partner.name} onChange={e => setDeliveryPartners(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} placeholder="Fan Courier" />
                  </div>
                  <div>
                    <Label className="text-xs">URL</Label>
                    <Input value={partner.url} onChange={e => setDeliveryPartners(prev => prev.map((p, idx) => idx === i ? { ...p, url: e.target.value } : p))} placeholder="https://www.fancourier.ro" />
                  </div>
                  <div>
                    <Label className="text-xs">URL imagine</Label>
                    <Input value={partner.image} onChange={e => setDeliveryPartners(prev => prev.map((p, idx) => idx === i ? { ...p, image: e.target.value } : p))} placeholder="/images/delivery/fan-courier.svg" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDeliveryPartners(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Company Info */}
        <TabsContent value="company" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Date Firmă & Program</h3>
            <Button size="sm" onClick={() => saveSection("footer_company_info", companyInfo)} disabled={saving === "footer_company_info"}>
              {saving === "footer_company_info" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Denumire firmă</Label>
                  <Input value={companyInfo.company_name} onChange={e => setCompanyInfo(prev => ({ ...prev, company_name: e.target.value }))} placeholder="MegaShop S.R.L." />
                </div>
                <div>
                  <Label>CUI</Label>
                  <Input value={companyInfo.cui} onChange={e => setCompanyInfo(prev => ({ ...prev, cui: e.target.value }))} placeholder="RO12345678" />
                </div>
                <div>
                  <Label>Reg. Com.</Label>
                  <Input value={companyInfo.reg_com} onChange={e => setCompanyInfo(prev => ({ ...prev, reg_com: e.target.value }))} placeholder="J40/1234/2020" />
                </div>
                <div>
                  <Label>Adresă sediu</Label>
                  <Input value={companyInfo.address} onChange={e => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))} placeholder="Str. Exemplu nr. 1, București" />
                </div>
                <div>
                  <Label>Program de lucru</Label>
                  <Input value={companyInfo.working_hours} onChange={e => setCompanyInfo(prev => ({ ...prev, working_hours: e.target.value }))} placeholder="Luni - Vineri: 09:00 - 18:00" />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Aplicație mobilă (opțional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Google Play URL</Label>
                    <Input value={companyInfo.google_play_url || ""} onChange={e => setCompanyInfo(prev => ({ ...prev, google_play_url: e.target.value }))} placeholder="https://play.google.com/store/apps/..." />
                  </div>
                  <div>
                    <Label>App Store URL</Label>
                    <Input value={companyInfo.app_store_url || ""} onChange={e => setCompanyInfo(prev => ({ ...prev, app_store_url: e.target.value }))} placeholder="https://apps.apple.com/..." />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
