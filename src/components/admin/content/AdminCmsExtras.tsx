import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

/**
 * Manages CMS keys that don't yet have a dedicated admin page:
 * - homepage_promo_banner: { enabled, text, bg_color, text_color, link }
 * - homepage_why_us: [{ icon, title, text }, ...]
 * - homepage_brands: [{ logo_url, name, link }, ...]
 * - shipping_page_content: { title, intro_html, free_shipping_threshold, delivery_time, carriers }
 * - tracking_page_content: { title, intro, embed_url }
 */

interface PromoBanner {
  enabled: boolean; text: string; bg_color: string; text_color: string; link: string;
}
interface WhyUsItem { icon: string; title: string; text: string }
interface BrandItem { logo_url: string; name: string; link: string }
interface ShippingPage {
  title: string; intro_html: string; free_shipping_threshold: number;
  delivery_time: string; carriers: string;
}
interface TrackingPage { title: string; intro: string; embed_url: string }

const DEFAULTS = {
  promo: { enabled: false, text: "", bg_color: "#B8935A", text_color: "#FFFFFF", link: "" } as PromoBanner,
  why_us: [
    { icon: "🚚", title: "Livrare rapidă", text: "În 24-48h" },
    { icon: "🔒", title: "Plată sigură", text: "SSL & 3D Secure" },
    { icon: "↩️", title: "Retur 14 zile", text: "Fără costuri" },
    { icon: "⭐", title: "Calitate premium", text: "100% verificată" },
  ] as WhyUsItem[],
  brands: [] as BrandItem[],
  shipping: {
    title: "Livrare", intro_html: "", free_shipping_threshold: 200,
    delivery_time: "1-3 zile lucrătoare", carriers: "Sameday, FAN Courier, Cargus"
  } as ShippingPage,
  tracking: {
    title: "Urmărire comandă",
    intro: "Introdu codul AWB pentru a vedea statusul comenzii.",
    embed_url: ""
  } as TrackingPage,
};

async function loadKey<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("app_settings").select("value_json").eq("key", key).maybeSingle();
  return (data?.value_json as T) ?? fallback;
}

async function saveKey(key: string, value: any) {
  const { data: existing } = await supabase.from("app_settings").select("id").eq("key", key).maybeSingle();
  if (existing) {
    await supabase.from("app_settings").update({ value_json: value as any }).eq("key", key);
  } else {
    await supabase.from("app_settings").insert({ key, value_json: value as any });
  }
}

export default function AdminCmsExtras() {
  const [promo, setPromo] = useState<PromoBanner>(DEFAULTS.promo);
  const [whyUs, setWhyUs] = useState<WhyUsItem[]>(DEFAULTS.why_us);
  const [brands, setBrands] = useState<BrandItem[]>(DEFAULTS.brands);
  const [shipping, setShipping] = useState<ShippingPage>(DEFAULTS.shipping);
  const [tracking, setTracking] = useState<TrackingPage>(DEFAULTS.tracking);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setPromo(await loadKey("homepage_promo_banner", DEFAULTS.promo));
      setWhyUs(await loadKey("homepage_why_us", DEFAULTS.why_us));
      setBrands(await loadKey("homepage_brands", DEFAULTS.brands));
      setShipping(await loadKey("shipping_page_content", DEFAULTS.shipping));
      setTracking(await loadKey("tracking_page_content", DEFAULTS.tracking));
    })();
  }, []);

  const save = async (key: string, value: any, label: string) => {
    setSaving(true);
    try { await saveKey(key, value); toast.success(`${label} salvat`); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conținut CMS — Secțiuni suplimentare</h1>
        <p className="text-sm text-muted-foreground">Banner promo, de ce noi, parteneri, livrare, urmărire comandă</p>
      </div>

      <Tabs defaultValue="promo">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="promo">Banner promo</TabsTrigger>
          <TabsTrigger value="why">De ce noi</TabsTrigger>
          <TabsTrigger value="brands">Parteneri</TabsTrigger>
          <TabsTrigger value="shipping">/livrare</TabsTrigger>
          <TabsTrigger value="tracking">/urmarire-comanda</TabsTrigger>
        </TabsList>

        {/* PROMO BANNER */}
        <TabsContent value="promo">
          <Card>
            <CardHeader><CardTitle>Banner promoțional homepage</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={promo.enabled} onCheckedChange={(v) => setPromo({ ...promo, enabled: v })} />
                <Label>Afișează banner</Label>
              </div>
              <div><Label>Text</Label><Input value={promo.text} onChange={(e) => setPromo({ ...promo, text: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Culoare fundal</Label><Input type="color" value={promo.bg_color} onChange={(e) => setPromo({ ...promo, bg_color: e.target.value })} /></div>
                <div><Label>Culoare text</Label><Input type="color" value={promo.text_color} onChange={(e) => setPromo({ ...promo, text_color: e.target.value })} /></div>
              </div>
              <div><Label>Link (opțional)</Label><Input value={promo.link} onChange={(e) => setPromo({ ...promo, link: e.target.value })} placeholder="/categorie/oferte" /></div>
              <Button onClick={() => save("homepage_promo_banner", promo, "Banner promo")} disabled={saving}>Salvează</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WHY US */}
        <TabsContent value="why">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                De ce noi
                <Button size="sm" variant="outline" onClick={() => setWhyUs([...whyUs, { icon: "✨", title: "", text: "" }])}>
                  <Plus className="w-4 h-4 mr-1" />Adaugă
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {whyUs.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-end p-3 border border-border rounded-md">
                  <div><Label>Icon</Label><Input value={item.icon} onChange={(e) => { const c = [...whyUs]; c[idx].icon = e.target.value; setWhyUs(c); }} /></div>
                  <div><Label>Titlu</Label><Input value={item.title} onChange={(e) => { const c = [...whyUs]; c[idx].title = e.target.value; setWhyUs(c); }} /></div>
                  <div><Label>Text</Label><Input value={item.text} onChange={(e) => { const c = [...whyUs]; c[idx].text = e.target.value; setWhyUs(c); }} /></div>
                  <Button variant="ghost" size="icon" onClick={() => setWhyUs(whyUs.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button onClick={() => save("homepage_why_us", whyUs, "De ce noi")} disabled={saving}>Salvează</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDS */}
        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Parteneri / Brands
                <Button size="sm" variant="outline" onClick={() => setBrands([...brands, { logo_url: "", name: "", link: "" }])}>
                  <Plus className="w-4 h-4 mr-1" />Adaugă
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {brands.length === 0 && <p className="text-sm text-muted-foreground">Niciun partener adăugat.</p>}
              {brands.map((b, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 border border-border rounded-md">
                  <div><Label>Logo URL</Label><Input value={b.logo_url} onChange={(e) => { const c = [...brands]; c[idx].logo_url = e.target.value; setBrands(c); }} /></div>
                  <div><Label>Nume</Label><Input value={b.name} onChange={(e) => { const c = [...brands]; c[idx].name = e.target.value; setBrands(c); }} /></div>
                  <div><Label>Link</Label><Input value={b.link} onChange={(e) => { const c = [...brands]; c[idx].link = e.target.value; setBrands(c); }} /></div>
                  <Button variant="ghost" size="icon" onClick={() => setBrands(brands.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button onClick={() => save("homepage_brands", brands, "Parteneri")} disabled={saving}>Salvează</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader><CardTitle>Pagina /livrare</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Titlu</Label><Input value={shipping.title} onChange={(e) => setShipping({ ...shipping, title: e.target.value })} /></div>
              <div><Label>Conținut (HTML)</Label><Textarea rows={8} value={shipping.intro_html} onChange={(e) => setShipping({ ...shipping, intro_html: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Termen livrare</Label><Input value={shipping.delivery_time} onChange={(e) => setShipping({ ...shipping, delivery_time: e.target.value })} /></div>
                <div><Label>Prag livrare gratuită (RON)</Label><Input type="number" value={shipping.free_shipping_threshold} onChange={(e) => setShipping({ ...shipping, free_shipping_threshold: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Transportatori</Label><Input value={shipping.carriers} onChange={(e) => setShipping({ ...shipping, carriers: e.target.value })} /></div>
              <Button onClick={() => save("shipping_page_content", shipping, "Pagina livrare")} disabled={saving}>Salvează</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRACKING */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader><CardTitle>Pagina /urmarire-comanda</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Titlu</Label><Input value={tracking.title} onChange={(e) => setTracking({ ...tracking, title: e.target.value })} /></div>
              <div><Label>Text introductiv</Label><Textarea rows={4} value={tracking.intro} onChange={(e) => setTracking({ ...tracking, intro: e.target.value })} /></div>
              <div>
                <Label>URL embed urmărire (iframe sau widget extern)</Label>
                <Input value={tracking.embed_url} onChange={(e) => setTracking({ ...tracking, embed_url: e.target.value })} placeholder="https://tracking.curier.ro/?awb={AWB}" />
                <p className="text-xs text-muted-foreground mt-1">Folosește {"{AWB}"} ca placeholder pentru numărul AWB</p>
              </div>
              <Button onClick={() => save("tracking_page_content", tracking, "Pagina urmărire")} disabled={saving}>Salvează</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
