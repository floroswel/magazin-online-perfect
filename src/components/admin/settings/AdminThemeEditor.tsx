import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Palette, Type, Square, Layout, Code, Monitor, Store, ShoppingBag, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins",
  "Raleway", "Playfair Display", "Merriweather", "Nunito", "DM Sans",
  "Outfit", "Manrope", "Source Sans 3",
];

interface ColorRowProps {
  label: string;
  description: string;
  settingKey: string;
  value: string;
  onSave: (key: string, val: string) => void;
}

function ColorRow({ label, description, settingKey, value, onSave }: ColorRowProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  const commit = (v: string) => {
    setLocal(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onSave(settingKey, v);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <div className="w-9 h-9 rounded-full border-2 border-border shrink-0" style={{ background: local }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Input
        value={local}
        onChange={e => commit(e.target.value)}
        className="w-[100px] h-8 text-xs font-mono"
      />
      <input
        type="color"
        value={local}
        onChange={e => commit(e.target.value)}
        className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0 shrink-0"
      />
    </div>
  );
}

function LivePreview({ settings }: { settings: Record<string, string> }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const p = settings;
    const primary = p.primary_color || "#0066FF";
    const secondary = p.secondary_color || "#111111";
    const accent = p.accent_color || "#FF3300";
    const bg = p.background_color || "#FFFFFF";
    const text = p.text_color || "#111827";
    const navBg = p.nav_bar_color || primary;
    const headerBg = p.header_bg || "#FFFFFF";
    const annBg = p.announcement_bg || accent;
    const annText = p.announcement_text_color || "#FFFFFF";
    const btnBg = p.btn_primary_bg || primary;
    const btnText = p.btn_primary_text || "#FFFFFF";
    const ctaBg = p.cta_bg || accent;
    const ctaText = p.cta_text || "#FFFFFF";
    const trustBg = p.trust_strip_color || primary;
    const nlBg = p.newsletter_bg || "#E8F0FF";
    const footerUp = p.footer_upper_bg || "#1A2332";
    const footerLo = p.footer_lower_bg || "#111111";
    const radius = p.btn_border_radius || "6";
    const headingFont = p.heading_font || "Inter";
    const bodyFont = p.body_font || "Inter";
    const priceColor = p.product_price_color || accent;
    const siteName = p.site_name || "LUMAX";

    const fontsToLoad = new Set<string>();
    if (headingFont !== "Inter") fontsToLoad.add(headingFont);
    if (bodyFont !== "Inter") fontsToLoad.add(bodyFont);
    const fontLink = fontsToLoad.size > 0
      ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, "+")}:wght@400;600;700`).join("&")}&display=swap">`
      : "";

    doc.open();
    doc.write(`<!DOCTYPE html><html><head>${fontLink}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'${bodyFont}',system-ui,sans-serif;background:${bg};color:${text};font-size:12px;line-height:1.5}
h1,h2,h3{font-family:'${headingFont}',serif}
.ann{background:${annBg};color:${annText};text-align:center;padding:4px;font-size:10px;font-weight:500}
.hdr{background:${headerBg};padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee}
.hdr h3{font-size:14px;color:${text}}
.nav{background:${navBg};padding:6px 12px;display:flex;gap:10px}
.nav span{color:#fff;font-size:10px;opacity:.85}
.hero{background:linear-gradient(135deg,${primary},${secondary});color:#fff;padding:20px 12px;text-align:center}
.hero h2{font-size:16px;margin-bottom:4px;color:#fff}
.hero p{font-size:10px;opacity:.9;margin-bottom:10px}
.btn{padding:6px 16px;border:none;border-radius:${radius}px;font-size:11px;font-weight:600;cursor:pointer}
.btn-p{background:${btnBg};color:${btnText}}
.btn-c{background:${ctaBg};color:${ctaText}}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px}
.card{border:1px solid #e5e7eb;border-radius:${radius}px;overflow:hidden;background:${bg}}
.card-img{height:50px;background:linear-gradient(45deg,${primary}22,${accent}22);display:flex;align-items:center;justify-content:center;font-size:20px}
.card-b{padding:6px}
.card-b h3{font-size:11px;margin-bottom:2px}
.card-b p{font-size:9px;color:#888}
.card-price{color:${priceColor};font-weight:700;font-size:12px;margin-top:2px}
.trust{background:${trustBg};color:#fff;padding:6px;text-align:center;font-size:9px;display:flex;gap:12px;justify-content:center}
.nl{background:${nlBg};padding:12px;text-align:center}
.nl h3{font-size:12px;margin-bottom:4px;color:${text}}
.nl p{font-size:9px;color:#888}
.foot-u{background:${footerUp};color:#ccc;padding:10px 12px;font-size:9px}
.foot-l{background:${footerLo};color:#888;padding:6px 12px;font-size:8px;text-align:center}
.btns{display:flex;gap:6px;justify-content:center;padding:8px}
</style></head><body>
<div class="ann">🔥 Transport GRATUIT la comenzi peste 200 RON</div>
<div class="hdr"><h3>🕯 ${siteName}</h3><span style="font-size:10px;color:#888">🔍 Cont 🛒</span></div>
<div class="nav"><span>Acasă</span><span>Lumânări</span><span>Seturi</span><span>Oferte</span></div>
<div class="hero"><h2>Lumânări Artizanale</h2><p>Descoperă colecția noastră</p><button class="btn btn-c">Cumpără Acum</button></div>
<div class="cards">
<div class="card"><div class="card-img">🕯</div><div class="card-b"><h3>Lavandă & Miere</h3><p>200g soia</p><div class="card-price">89 RON</div></div></div>
<div class="card"><div class="card-img">🌿</div><div class="card-b"><h3>Eucalipt Fresh</h3><p>300g soia</p><div class="card-price">119 RON</div></div></div>
<div class="card"><div class="card-img">🍊</div><div class="card-b"><h3>Citrice Vanilie</h3><p>250g soia</p><div class="card-price">95 RON</div></div></div>
</div>
<div class="btns"><button class="btn btn-p">Adaugă în Coș</button><button class="btn btn-c">Cumpără Acum</button></div>
<div class="trust">✓ Livrare Rapidă ✓ Produse Naturale ✓ Garanție 30 Zile</div>
<div class="nl"><h3>Newsletter</h3><p>Abonează-te pentru oferte</p></div>
<div class="foot-u">${siteName} · Contact · Despre Noi · Termeni</div>
<div class="foot-l">© 2026 ${siteName}. Toate drepturile rezervate.</div>
</body></html>`);
    doc.close();
  }, [settings]);

  return (
    <div className="sticky top-4">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Preview Live</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden shadow-lg bg-background">
        <iframe ref={iframeRef} className="w-full border-0" style={{ height: "520px" }} title="Theme Preview" />
      </div>
    </div>
  );
}

export default function AdminThemeEditor() {
  const { settings, updateSetting } = useSettings();
  const [saveStatus, setSaveStatus] = useState("");
  const [customCssDraft, setCustomCssDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  const saveSetting = useCallback(async (key: string, value: string) => {
    const saved = await updateSetting(key, value);
    if (saved) {
      setSaveStatus("✅ Salvat");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  }, [updateSetting]);

  const get = (key: string, fallback: string = "") => settings[key] || fallback;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `branding/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Eroare la încărcare: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    await saveSetting("logo_url", urlData.publicUrl);
    setUploading(false);
    toast.success("Logo încărcat!");
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `branding/favicon-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Eroare la încărcare: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    await saveSetting("favicon_url", urlData.publicUrl);
    // Also update the actual favicon in the page
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (link) link.href = urlData.publicUrl;
    setUploading(false);
    toast.success("Favicon încărcat!");
  };

  const removeLogo = async () => {
    await saveSetting("logo_url", "");
    toast.success("Logo șters");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editor Temă</h1>
          <p className="text-sm text-muted-foreground">Modificările se aplică instant pe site</p>
        </div>
        {saveStatus && (
          <span className="text-sm font-medium text-green-600 animate-in fade-in">{saveStatus}</span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-5">

          {/* ══════ SECTION 0: IDENTITATE BRAND ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="w-4 h-4 text-primary" /> Identitate Brand
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Numele Magazinului</Label>
                  <Input
                    value={get("site_name", "LUMAX")}
                    onChange={e => saveSetting("site_name", e.target.value)}
                    className="mt-1"
                    placeholder="Numele magazinului"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Apare în header, footer, email-uri, SEO</p>
                </div>
                <div>
                  <Label className="text-xs">Slogan / Tagline</Label>
                  <Input
                    value={get("site_tagline", "")}
                    onChange={e => saveSetting("site_tagline", e.target.value)}
                    className="mt-1"
                    placeholder="Sloganul magazinului"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Apare sub logo în header</p>
                </div>
              </div>

              <Separator />

              {/* Logo */}
              <div>
                <Label className="text-xs mb-2 block">Logo Magazin</Label>
                <div className="flex items-center gap-4">
                  {get("logo_url") ? (
                    <div className="border border-border rounded-lg p-2 bg-card">
                      <img src={get("logo_url")} alt="Logo" className="h-10 object-contain" />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg w-24 h-12 flex items-center justify-center text-muted-foreground text-xs">
                      Fără logo
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <Button size="sm" variant="outline" asChild disabled={uploading}>
                        <span><Upload className="w-3 h-3 mr-1" /> {uploading ? "Se încarcă..." : "Alege Logo"}</span>
                      </Button>
                    </label>
                    {get("logo_url") && (
                      <Button size="sm" variant="outline" onClick={removeLogo}>
                        <Trash2 className="w-3 h-3 mr-1" /> Șterge
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Visible */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Afișează logo imagine</Label>
                  <p className="text-[10px] text-muted-foreground">Dacă e dezactivat, se afișează textul numelui</p>
                </div>
                <Switch
                  checked={get("logo_visible", "true") === "true"}
                  onCheckedChange={v => saveSetting("logo_visible", v ? "true" : "false")}
                />
              </div>

              <Separator />

              {/* Favicon */}
              <div>
                <Label className="text-xs mb-2 block">Favicon</Label>
                <div className="flex items-center gap-4">
                  {get("favicon_url") ? (
                    <img src={get("favicon_url")} alt="Favicon" className="w-8 h-8 object-contain border border-border rounded" />
                  ) : (
                    <div className="border-2 border-dashed border-border rounded w-8 h-8 flex items-center justify-center text-muted-foreground text-[8px]">
                      —
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/png,image/x-icon,image/ico" className="hidden" onChange={handleFaviconUpload} />
                    <Button size="sm" variant="outline" asChild disabled={uploading}>
                      <span><Upload className="w-3 h-3 mr-1" /> Alege Favicon</span>
                    </Button>
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">32×32px sau 64×64px, format ICO/PNG</p>
              </div>
            </CardContent>
          </Card>

          {/* ══════ SECTION 1: CULORI PRINCIPALE ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4 text-primary" /> Culori Principale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorRow label="Culoare Primară" description="Butoane, navigare, link-uri" settingKey="primary_color" value={get("primary_color", "#0066FF")} onSave={saveSetting} />
              <ColorRow label="Culoare Secundară" description="Text, elemente dark" settingKey="secondary_color" value={get("secondary_color", "#111111")} onSave={saveSetting} />
              <ColorRow label="Culoare Accent" description="Badge-uri, CTA, reduceri" settingKey="accent_color" value={get("accent_color", "#FF3300")} onSave={saveSetting} />
              <ColorRow label="Fundal Site" description="Culoarea de fundal principală" settingKey="background_color" value={get("background_color", "#FFFFFF")} onSave={saveSetting} />
              <ColorRow label="Text Principal" description="Culoarea textului" settingKey="text_color" value={get("text_color", "#111827")} onSave={saveSetting} />
            </CardContent>
          </Card>

          {/* ══════ SECTION 2: HEADER & NAVIGARE ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layout className="w-4 h-4 text-primary" /> Header & Navigare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorRow label="Fundal Header" description="Bara principală cu logo" settingKey="header_bg" value={get("header_bg", "#FFFFFF")} onSave={saveSetting} />
              <ColorRow label="Bara Navigare" description="Mega-menu, categorii" settingKey="nav_bar_color" value={get("nav_bar_color", "#0066FF")} onSave={saveSetting} />
              <ColorRow label="Announcement Bar - Fundal" description="Bara de sus cu promoții" settingKey="announcement_bg" value={get("announcement_bg", "#FF3300")} onSave={saveSetting} />
              <ColorRow label="Announcement Bar - Text" description="Textul din bara de sus" settingKey="announcement_text_color" value={get("announcement_text_color", "#FFFFFF")} onSave={saveSetting} />
            </CardContent>
          </Card>

          {/* ══════ SECTION 3: BUTOANE ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Square className="w-4 h-4 text-primary" /> Butoane
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorRow label="Buton Principal - Fundal" description="Adaugă în Coș, acțiuni principale" settingKey="btn_primary_bg" value={get("btn_primary_bg", "#0066FF")} onSave={saveSetting} />
              <ColorRow label="Buton Principal - Text" description="Textul de pe butoane" settingKey="btn_primary_text" value={get("btn_primary_text", "#FFFFFF")} onSave={saveSetting} />
              <ColorRow label="Buton Principal - Hover" description="Culoarea la hover" settingKey="btn_primary_hover" value={get("btn_primary_hover", "#0052CC")} onSave={saveSetting} />
              <ColorRow label="CTA - Fundal" description="Butoane Cumpără Acum" settingKey="cta_bg" value={get("cta_bg", "#FF3300")} onSave={saveSetting} />
              <ColorRow label="CTA - Text" description="Textul de pe CTA" settingKey="cta_text" value={get("cta_text", "#FFFFFF")} onSave={saveSetting} />
              <Separator />
              <div>
                <Label className="text-sm font-medium">Rotunjire Butoane: {get("btn_border_radius", "6")}px</Label>
                <Slider
                  value={[parseInt(get("btn_border_radius", "6"))]}
                  onValueChange={([v]) => saveSetting("btn_border_radius", String(v))}
                  min={0} max={50} step={1} className="mt-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Pătrat</span><span>Rotund</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══════ SECTION 4: CULORI SECȚIUNI ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layout className="w-4 h-4 text-primary" /> Culori Secțiuni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorRow label="Trust Strip" description="Bara de încredere" settingKey="trust_strip_color" value={get("trust_strip_color", "#0066FF")} onSave={saveSetting} />
              <ColorRow label="Newsletter" description="Secțiunea newsletter" settingKey="newsletter_bg" value={get("newsletter_bg", "#E8F0FF")} onSave={saveSetting} />
              <ColorRow label="Footer Superior" description="Partea de sus a footer-ului" settingKey="footer_upper_bg" value={get("footer_upper_bg", "#1A2332")} onSave={saveSetting} />
              <ColorRow label="Footer Inferior" description="Partea de jos a footer-ului" settingKey="footer_lower_bg" value={get("footer_lower_bg", "#111111")} onSave={saveSetting} />
            </CardContent>
          </Card>

          {/* ══════ SECTION 5: PRODUSE & CATALOG ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="w-4 h-4 text-primary" /> Produse & Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorRow label="Culoare Preț Produse" description="Prețul afișat pe card și pagina produs" settingKey="product_price_color" value={get("product_price_color", "#FF3300")} onSave={saveSetting} />
              <ColorRow label="Culoare Stele Rating" description="Stelele de rating" settingKey="product_stars_color" value={get("product_stars_color", "#FFB800")} onSave={saveSetting} />
              <ColorRow label="Culoare Badge Reducere" description="Badge-ul cu procentul de reducere" settingKey="badge_sale_color" value={get("badge_sale_color", "#FF3300")} onSave={saveSetting} />
              <ColorRow label="Culoare Badge Nou" description="Badge-ul NOU pe produse" settingKey="badge_new_color" value={get("badge_new_color", "#00A650")} onSave={saveSetting} />
              <ColorRow label="Culoare Transport Gratuit" description="Textul livrare gratuită" settingKey="free_shipping_color" value={get("free_shipping_color", "#00A650")} onSave={saveSetting} />
              <ColorRow label="Culoare Economii" description="Textul Economisești X lei" settingKey="savings_color" value={get("savings_color", "#00A650")} onSave={saveSetting} />
            </CardContent>
          </Card>

          {/* ══════ SECTION 6: TIPOGRAFIE ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="w-4 h-4 text-primary" /> Tipografie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Font Titluri</Label>
                  <Select value={get("heading_font", "Inter")} onValueChange={v => saveSetting("heading_font", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font Body</Label>
                  <Select value={get("body_font", "Inter")} onValueChange={v => saveSetting("body_font", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Dimensiune Text</Label>
                  <Select value={get("font_size_scale", "1")} onValueChange={v => saveSetting("font_size_scale", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.9">Mic (0.9x)</SelectItem>
                      <SelectItem value="1">Normal (1x)</SelectItem>
                      <SelectItem value="1.1">Mare (1.1x)</SelectItem>
                      <SelectItem value="1.2">Foarte Mare (1.2x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mărime Titluri</Label>
                  <Select value={get("heading_size", "standard")} onValueChange={v => saveSetting("heading_size", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="large">Mare</SelectItem>
                      <SelectItem value="xl">Foarte Mare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══════ SECTION 7: CSS CUSTOM ══════ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="w-4 h-4 text-primary" /> CSS Personalizat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customCssDraft || get("custom_css", "")}
                onChange={e => setCustomCssDraft(e.target.value)}
                placeholder="/* Adaugă CSS personalizat aici */"
                className="font-mono text-xs min-h-[160px]"
              />
              <Button size="sm" className="mt-3" onClick={() => saveSetting("custom_css", customCssDraft || get("custom_css", ""))}>
                Aplică CSS
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <LivePreview settings={settings} />
      </div>
    </div>
  );
}
