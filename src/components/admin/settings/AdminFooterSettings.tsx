import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, Truck, CreditCard, Shield, Eye, ImageIcon, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────
interface LogoItem {
  name: string;
  image: string;
  url: string;
  width: number;
  active: boolean;
  target: "_self" | "_blank";
}

interface LegalScript {
  id: string;
  label: string;
  sublabel: string;
  active: boolean;
  link: string;
  image: string;
  width: number;
  alt: string;
}

interface FooterLink {
  label: string;
  url: string;
  active: boolean;
}

interface FooterTexts {
  col1_title: string;
  col1_description: string;
  col2_title: string;
  col2_links: FooterLink[];
  col3_title: string;
  col3_links: FooterLink[];
  col4_title: string;
  col4_email: string;
  col4_phone: string;
  col4_address: string;
  col4_hours: string;
  col4_show_email: boolean;
  col4_show_phone: boolean;
  col4_show_address: boolean;
  col4_show_hours: boolean;
  copyright: string;
  extra_legal: string;
  show_made_in: boolean;
  delivery_section_title: string;
  payment_section_title: string;
  partners_section_title: string;
  show_partners_section: boolean;
  legal_section_title: string;
  sal_sublabel: string;
  sol_sublabel: string;
}

// ─── PRELOADED TEMPLATES ─────────────────────────────────
const COURIER_PRESETS: Partial<LogoItem>[] = [
  { name: "Sameday", image: "https://www.sameday.ro/wp-content/themes/developer-developer/images/logo-sameday.svg", url: "https://www.sameday.ro" },
  { name: "Fan Courier", image: "https://www.fancourier.ro/wp-content/uploads/2019/04/logo-fan-courier.png", url: "https://www.fancourier.ro" },
  { name: "DPD", image: "https://www.dpd.com/content/uploads/2020/03/DPD_logo_redGrad_rgb.png", url: "https://www.dpd.ro" },
  { name: "DHL", image: "https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg", url: "https://www.dhl.ro" },
  { name: "GLS", image: "https://gls-group.eu/GROUP/media/logo-gls.svg", url: "https://gls-group.eu" },
  { name: "Urgent Cargus", image: "https://www.cargus.ro/wp-content/uploads/logo-cargus.svg", url: "https://www.cargus.ro" },
  { name: "Poșta Română", image: "https://www.posta-romana.ro/images/logo.png", url: "https://www.posta-romana.ro" },
  { name: "FedEx", image: "https://upload.wikimedia.org/wikipedia/commons/b/b9/FedEx_Express.svg", url: "https://www.fedex.com" },
  { name: "UPS", image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/United_Parcel_Service_logo_2014.svg", url: "https://www.ups.com" },
];

const PAYMENT_PRESETS: Partial<LogoItem>[] = [
  { name: "Visa", image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
  { name: "Mastercard", image: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
  { name: "NETOPIA", image: "https://netopia-payments.com/wp-content/uploads/2021/01/netopia-payments-logo.svg" },
  { name: "PayPal", image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { name: "Apple Pay", image: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" },
  { name: "Google Pay", image: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" },
  { name: "TBI Bank", image: "" },
  { name: "PayPo", image: "" },
  { name: "Ramburs", image: "" },
  { name: "Transfer Bancar", image: "" },
];

const DEFAULT_TEXTS: FooterTexts = {
  col1_title: "VENTUZA", col1_description: "Lumânări handmade realizate cu pasiune în România. Ceară naturală, parfumuri premium.",
  col2_title: "Navigare", col2_links: [
    { label: "Acasă", url: "/", active: true },
    { label: "Produse", url: "/catalog", active: true },
    { label: "Personalizare", url: "/personalizare", active: true },
    { label: "Despre noi", url: "/povestea-noastra", active: true },
    { label: "Blog", url: "/blog", active: true },
    { label: "Contact", url: "/page/contact", active: true },
  ],
  col3_title: "Informații", col3_links: [
    { label: "Politica de confidențialitate", url: "/page/politica-de-confidentialitate", active: true },
    { label: "Termeni și condiții", url: "/page/termeni-si-conditii", active: true },
    { label: "Politica de retur", url: "/page/returnare", active: true },
    { label: "Livrare și transport", url: "/page/livrare", active: true },
    { label: "FAQ", url: "/page/faq", active: true },
  ],
  col4_title: "Contact", col4_email: "", col4_phone: "", col4_address: "", col4_hours: "",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} VENTUZA. Toate drepturile rezervate.",
  extra_legal: "", show_made_in: true,
  delivery_section_title: "Livrare prin",
  payment_section_title: "Metode de plată",
  partners_section_title: "Parteneri",
  show_partners_section: false,
  legal_section_title: "Soluționarea litigiilor",
  sal_sublabel: "Soluționarea alternativă a litigiilor – informații pentru consumatori. ANPC – SAL",
  sol_sublabel: "Platforma europeană de soluționare online a litigiilor. SOL – Platformă ODR",
};

const DEFAULT_LEGAL: LegalScript[] = [
  {
    id: "anpc-sal", label: "ANPC – SAL", sublabel: "Soluționarea Alternativă a Litigiilor",
    active: true, link: "https://anpc.ro/ce-este-sal/",
    image: "https://e-advertising.co/anpc/eadv-sal.png", width: 250,
    alt: "Solutionarea Alternativa a Litigiilor",
  },
  {
    id: "sol-odr", label: "SOL – ODR", sublabel: "Platformă europeană ODR",
    active: true, link: "https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home.chooseLanguage",
    image: "https://e-advertising.co/anpc/eadv-sol.png", width: 250,
    alt: "Solutionarea Online a Litigiilor",
  },
];

// ─── LOGO EDITOR SUB-COMPONENT ───────────────────────────
function LogoEditor({
  title, items, setItems, presets, sectionKey, saving, onSave,
}: {
  title: string;
  items: LogoItem[];
  setItems: (fn: (prev: LogoItem[]) => LogoItem[]) => void;
  presets: Partial<LogoItem>[];
  sectionKey: string;
  saving: string | null;
  onSave: (key: string, val: any) => void;
}) {
  const addPreset = (p: Partial<LogoItem>) => {
    if (items.some(i => i.name === p.name)) { toast.info(`${p.name} este deja adăugat`); return; }
    setItems(prev => [...prev, { name: p.name || "", image: p.image || "", url: p.url || "", width: 80, active: true, target: "_blank" }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, { name: "", image: "", url: "", width: 80, active: true, target: "_blank" }])}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă
          </Button>
          <Button size="sm" onClick={() => onSave(sectionKey, items)} disabled={saving === sectionKey}>
            {saving === sectionKey ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
          </Button>
        </div>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Adaugă rapid:</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, i) => (
              <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => addPreset(p)}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Niciun logo adăugat.</p>}

      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-3">
              <div className="pt-2 text-muted-foreground cursor-grab"><GripVertical className="w-4 h-4" /></div>
              {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-contain bg-muted p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <div>
                  <Label className="text-[10px]">Nume (alt text)</Label>
                  <Input value={item.name} onChange={e => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, name: e.target.value } : l))} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">URL imagine</Label>
                  <Input value={item.image} onChange={e => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, image: e.target.value } : l))} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Link URL</Label>
                  <Input value={item.url} onChange={e => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))} className="h-8 text-xs" />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px]">Lățime (px)</Label>
                    <Input type="number" value={item.width} onChange={e => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, width: parseInt(e.target.value) || 80 } : l))} className="h-8 text-xs" />
                  </div>
                  <div className="flex items-center gap-1.5 pb-0.5">
                    <Switch checked={item.active} onCheckedChange={v => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, active: v } : l))} />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <Select value={item.target} onValueChange={(v: "_self" | "_blank") => setItems(prev => prev.map((l, idx) => idx === i ? { ...l, target: v } : l))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_blank">Tab nou</SelectItem>
                      <SelectItem value="_self">Același tab</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function AdminFooterSettings() {
  const [deliveryLogos, setDeliveryLogos] = useState<LogoItem[]>([]);
  const [paymentLogos, setPaymentLogos] = useState<LogoItem[]>([]);
  const [partnerLogos, setPartnerLogos] = useState<LogoItem[]>([]);
  const [legalScripts, setLegalScripts] = useState<LegalScript[]>(DEFAULT_LEGAL);
  const [footerTexts, setFooterTexts] = useState<FooterTexts>(DEFAULT_TEXTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", [
        "footer_delivery_logos", "footer_payment_logos", "footer_partner_logos",
        "footer_legal_scripts", "footer_texts",
        // Legacy keys — migrate on load
        "footer_delivery_partners", "footer_payment_methods",
      ])
      .then(({ data }) => {
        data?.forEach(row => {
          const val = row.value_json;
          switch (row.key) {
            case "footer_delivery_logos":
              if (Array.isArray(val)) setDeliveryLogos(val as unknown as LogoItem[]);
              break;
            case "footer_delivery_partners":
              // Legacy migration
              if (Array.isArray(val) && !data.some(r => r.key === "footer_delivery_logos")) {
                setDeliveryLogos((val as any[]).map(v => ({ name: v.name || "", image: v.image || "", url: v.url || "", width: 80, active: true, target: "_blank" as const })));
              }
              break;
            case "footer_payment_logos":
              if (Array.isArray(val)) setPaymentLogos(val as unknown as LogoItem[]);
              break;
            case "footer_payment_methods":
              if (Array.isArray(val) && !data.some(r => r.key === "footer_payment_logos")) {
                setPaymentLogos((val as any[]).map(v => ({ name: v.name || "", image: v.image || "", url: "", width: 60, active: true, target: "_self" as const })));
              }
              break;
            case "footer_partner_logos":
              if (Array.isArray(val)) setPartnerLogos(val as unknown as LogoItem[]);
              break;
            case "footer_legal_scripts":
              if (Array.isArray(val)) setLegalScripts(val as unknown as LegalScript[]);
              break;
            case "footer_texts":
              if (val && typeof val === "object" && !Array.isArray(val)) setFooterTexts({ ...DEFAULT_TEXTS, ...(val as any) });
              break;
          }
        });
        setLoading(false);
      });
  }, []);

  const saveSection = useCallback(async (key: string, value: any) => {
    setSaving(key);
    await supabase.from("app_settings").upsert(
      { key, value_json: value as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(null);
    toast.success("Salvat cu succes!");
  }, []);

  const updateText = <K extends keyof FooterTexts>(key: K, value: FooterTexts[K]) => {
    setFooterTexts(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Footer Manager</h1>
        <p className="text-sm text-muted-foreground">Controlează complet conținutul footer-ului: logo-uri, badge-uri legale, texte și previzualizare</p>
      </div>

      <Tabs defaultValue="logos" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="logos"><ImageIcon className="w-4 h-4 mr-1.5" /> Logo-uri</TabsTrigger>
          <TabsTrigger value="legal"><Shield className="w-4 h-4 mr-1.5" /> Scripturi Legale</TabsTrigger>
          <TabsTrigger value="texts">Texte Footer</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-1.5" /> Previzualizare</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: LOGOS ═══ */}
        <TabsContent value="logos" className="space-y-8">
          <LogoEditor
            title="🚚 Livrare prin"
            items={deliveryLogos} setItems={setDeliveryLogos}
            presets={COURIER_PRESETS} sectionKey="footer_delivery_logos"
            saving={saving} onSave={saveSection}
          />
          <div className="border-t" />
          <LogoEditor
            title="💳 Metode de plată"
            items={paymentLogos} setItems={setPaymentLogos}
            presets={PAYMENT_PRESETS} sectionKey="footer_payment_logos"
            saving={saving} onSave={saveSection}
          />
          <div className="border-t" />
          <LogoEditor
            title="🏅 Parteneri & Certificări"
            items={partnerLogos} setItems={setPartnerLogos}
            presets={[]} sectionKey="footer_partner_logos"
            saving={saving} onSave={saveSection}
          />
        </TabsContent>

        {/* ═══ TAB 2: LEGAL SCRIPTS ═══ */}
        <TabsContent value="legal" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground">ANPC SAL & SOL — Badge-uri legale</h3>
              <p className="text-xs text-muted-foreground">Pre-configurat cu link-urile oficiale ANPC. Obligatoriu pentru magazine online.</p>
            </div>
            <Button size="sm" onClick={() => saveSection("footer_legal_scripts", legalScripts)} disabled={saving === "footer_legal_scripts"}>
              {saving === "footer_legal_scripts" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează
            </Button>
          </div>

          {legalScripts.map((script, i) => (
            <Card key={script.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {script.image && <img src={script.image} alt={script.alt} className="h-10 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{script.label}</p>
                      <p className="text-xs text-muted-foreground">{script.sublabel}</p>
                    </div>
                  </div>
                  <Switch checked={script.active} onCheckedChange={v => setLegalScripts(prev => prev.map((s, idx) => idx === i ? { ...s, active: v } : s))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Link</Label>
                    <Input value={script.link} onChange={e => setLegalScripts(prev => prev.map((s, idx) => idx === i ? { ...s, link: e.target.value } : s))} className="text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">URL Imagine</Label>
                    <Input value={script.image} onChange={e => setLegalScripts(prev => prev.map((s, idx) => idx === i ? { ...s, image: e.target.value } : s))} className="text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Lățime (px)</Label>
                    <Input type="number" value={script.width} onChange={e => setLegalScripts(prev => prev.map((s, idx) => idx === i ? { ...s, width: parseInt(e.target.value) || 250 } : s))} className="text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Alt text</Label>
                    <Input value={script.alt} onChange={e => setLegalScripts(prev => prev.map((s, idx) => idx === i ? { ...s, alt: e.target.value } : s))} className="text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            ⚠️ Scripturile de mai sus sunt pre-configurate cu link-urile oficiale ANPC. Modificați doar dacă primiți alte date de la eAdvertising sau ANPC.
          </div>

          {/* Section title config */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Texte afișate în footer</h4>
              <div>
                <Label className="text-xs">Titlu secțiune legală</Label>
                <Input value={footerTexts.legal_section_title} onChange={e => updateText("legal_section_title", e.target.value)} className="text-xs" />
              </div>
              <div>
                <Label className="text-xs">SAL sublabel</Label>
                <Input value={footerTexts.sal_sublabel} onChange={e => updateText("sal_sublabel", e.target.value)} className="text-xs" />
              </div>
              <div>
                <Label className="text-xs">SOL sublabel</Label>
                <Input value={footerTexts.sol_sublabel} onChange={e => updateText("sol_sublabel", e.target.value)} className="text-xs" />
              </div>
              <Button size="sm" onClick={() => saveSection("footer_texts", footerTexts)} disabled={saving === "footer_texts"}>
                <Save className="w-4 h-4 mr-1" /> Salvează texte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 3: TEXTS ═══ */}
        <TabsContent value="texts" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => saveSection("footer_texts", footerTexts)} disabled={saving === "footer_texts"}>
              {saving === "footer_texts" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvează toate textele
            </Button>
          </div>

          {/* Column 1: About */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Coloana 1 — Despre noi</h4>
              <div>
                <Label className="text-xs">Titlu secțiune</Label>
                <Input value={footerTexts.col1_title} onChange={e => updateText("col1_title", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Descriere scurtă (max 200 caractere)</Label>
                <Textarea value={footerTexts.col1_description} onChange={e => updateText("col1_description", e.target.value.slice(0, 200))} rows={3} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{footerTexts.col1_description.length}/200</p>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Navigation */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground text-sm">Coloana 2 — Navigare rapidă</h4>
                <Button variant="outline" size="sm" onClick={() => updateText("col2_links", [...footerTexts.col2_links, { label: "", url: "/", active: true }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Link
                </Button>
              </div>
              <div>
                <Label className="text-xs">Titlu secțiune</Label>
                <Input value={footerTexts.col2_title} onChange={e => updateText("col2_title", e.target.value)} />
              </div>
              {footerTexts.col2_links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                  <Input value={link.label} onChange={e => {
                    const updated = [...footerTexts.col2_links];
                    updated[i] = { ...updated[i], label: e.target.value };
                    updateText("col2_links", updated);
                  }} placeholder="Etichetă" className="h-8 text-xs flex-1" />
                  <Input value={link.url} onChange={e => {
                    const updated = [...footerTexts.col2_links];
                    updated[i] = { ...updated[i], url: e.target.value };
                    updateText("col2_links", updated);
                  }} placeholder="/url" className="h-8 text-xs flex-1" />
                  <Switch checked={link.active} onCheckedChange={v => {
                    const updated = [...footerTexts.col2_links];
                    updated[i] = { ...updated[i], active: v };
                    updateText("col2_links", updated);
                  }} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => updateText("col2_links", footerTexts.col2_links.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Column 3: Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground text-sm">Coloana 3 — Informații</h4>
                <Button variant="outline" size="sm" onClick={() => updateText("col3_links", [...footerTexts.col3_links, { label: "", url: "/", active: true }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Link
                </Button>
              </div>
              <div>
                <Label className="text-xs">Titlu secțiune</Label>
                <Input value={footerTexts.col3_title} onChange={e => updateText("col3_title", e.target.value)} />
              </div>
              {footerTexts.col3_links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                  <Input value={link.label} onChange={e => {
                    const updated = [...footerTexts.col3_links];
                    updated[i] = { ...updated[i], label: e.target.value };
                    updateText("col3_links", updated);
                  }} placeholder="Etichetă" className="h-8 text-xs flex-1" />
                  <Input value={link.url} onChange={e => {
                    const updated = [...footerTexts.col3_links];
                    updated[i] = { ...updated[i], url: e.target.value };
                    updateText("col3_links", updated);
                  }} placeholder="/url" className="h-8 text-xs flex-1" />
                  <Switch checked={link.active} onCheckedChange={v => {
                    const updated = [...footerTexts.col3_links];
                    updated[i] = { ...updated[i], active: v };
                    updateText("col3_links", updated);
                  }} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => updateText("col3_links", footerTexts.col3_links.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Column 4: Contact */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Coloana 4 — Contact</h4>
              <div>
                <Label className="text-xs">Titlu secțiune</Label>
                <Input value={footerTexts.col4_title} onChange={e => updateText("col4_title", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Email</Label>
                    <Switch checked={footerTexts.col4_show_email} onCheckedChange={v => updateText("col4_show_email", v)} />
                  </div>
                  <Input value={footerTexts.col4_email} onChange={e => updateText("col4_email", e.target.value)} placeholder="contact@ventuza.ro" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Telefon</Label>
                    <Switch checked={footerTexts.col4_show_phone} onCheckedChange={v => updateText("col4_show_phone", v)} />
                  </div>
                  <Input value={footerTexts.col4_phone} onChange={e => updateText("col4_phone", e.target.value)} placeholder="0712 345 678" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Adresă</Label>
                  <Switch checked={footerTexts.col4_show_address} onCheckedChange={v => updateText("col4_show_address", v)} />
                </div>
                <Textarea value={footerTexts.col4_address} onChange={e => updateText("col4_address", e.target.value)} rows={2} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Program de lucru</Label>
                  <Switch checked={footerTexts.col4_show_hours} onCheckedChange={v => updateText("col4_show_hours", v)} />
                </div>
                <Textarea value={footerTexts.col4_hours} onChange={e => updateText("col4_hours", e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Copyright */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Copyright & Legal</h4>
              <div>
                <Label className="text-xs">Text copyright (folosește {"{year}"} pentru an automat)</Label>
                <Input value={footerTexts.copyright} onChange={e => updateText("copyright", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Text legal adițional (opțional)</Label>
                <Textarea value={footerTexts.extra_legal} onChange={e => updateText("extra_legal", e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={footerTexts.show_made_in} onCheckedChange={v => updateText("show_made_in", v)} />
                <Label className="text-xs">Afișează "Made with ❤️ în România"</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section titles */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Titluri secțiuni logo-uri</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Livrare</Label>
                  <Input value={footerTexts.delivery_section_title} onChange={e => updateText("delivery_section_title", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Plăți</Label>
                  <Input value={footerTexts.payment_section_title} onChange={e => updateText("payment_section_title", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Parteneri</Label>
                  <Input value={footerTexts.partners_section_title} onChange={e => updateText("partners_section_title", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={footerTexts.show_partners_section} onCheckedChange={v => updateText("show_partners_section", v)} />
                <Label className="text-xs">Afișează secțiunea Parteneri</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: PREVIEW ═══ */}
        <TabsContent value="preview" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Previzualizare:</span>
            {(["desktop", "tablet", "mobile"] as const).map(mode => (
              <Button key={mode} variant={previewMode === mode ? "default" : "outline"} size="sm" onClick={() => setPreviewMode(mode)}>
                {mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobile"}
              </Button>
            ))}
          </div>

          <div className={`bg-secondary text-white rounded-lg overflow-hidden ${
            previewMode === "mobile" ? "max-w-sm mx-auto" : previewMode === "tablet" ? "max-w-2xl mx-auto" : ""
          }`}>
            <div className="p-6">
              {/* Main grid */}
              <div className={`grid gap-6 ${previewMode === "mobile" ? "grid-cols-1" : previewMode === "tablet" ? "grid-cols-2" : "grid-cols-4"}`}>
                <div>
                  <h3 className="text-base font-bold mb-2">{footerTexts.col1_title}</h3>
                  <p className="text-xs text-white/70">{footerTexts.col1_description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">{footerTexts.col2_title}</h4>
                  <ul className="space-y-1 text-xs text-white/70">
                    {footerTexts.col2_links.filter(l => l.active).map((l, i) => <li key={i}>{l.label}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">{footerTexts.col3_title}</h4>
                  <ul className="space-y-1 text-xs text-white/70">
                    {footerTexts.col3_links.filter(l => l.active).map((l, i) => <li key={i}>{l.label}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">{footerTexts.col4_title}</h4>
                  <div className="text-xs text-white/70 space-y-1">
                    {footerTexts.col4_show_phone && footerTexts.col4_phone && <p>📞 {footerTexts.col4_phone}</p>}
                    {footerTexts.col4_show_email && footerTexts.col4_email && <p>✉️ {footerTexts.col4_email}</p>}
                    {footerTexts.col4_show_hours && footerTexts.col4_hours && <p>🕐 {footerTexts.col4_hours}</p>}
                  </div>
                </div>
              </div>

              {/* Logos */}
              {(deliveryLogos.filter(l => l.active).length > 0 || paymentLogos.filter(l => l.active).length > 0) && (
                <div className="border-t border-white/10 mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliveryLogos.filter(l => l.active).length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">{footerTexts.delivery_section_title}</p>
                      <div className="flex flex-wrap gap-2">
                        {deliveryLogos.filter(l => l.active).map((l, i) => (
                          <div key={i} className="bg-white/10 rounded px-2 py-1">
                            {l.image ? <img src={l.image} alt={l.name} style={{ height: 20 }} className="object-contain" onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode(l.name)); }} /> : <span className="text-[10px]">{l.name}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {paymentLogos.filter(l => l.active).length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">{footerTexts.payment_section_title}</p>
                      <div className="flex flex-wrap gap-2">
                        {paymentLogos.filter(l => l.active).map((l, i) => (
                          <div key={i} className="bg-white/10 rounded px-2 py-1">
                            {l.image ? <img src={l.image} alt={l.name} style={{ height: 20 }} className="object-contain" onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode(l.name)); }} /> : <span className="text-[10px]">{l.name}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Legal badges */}
              {legalScripts.filter(s => s.active).length > 0 && (
                <div className="border-t border-white/10 mt-4 pt-4 text-center">
                  <p className="text-xs font-semibold mb-2">{footerTexts.legal_section_title}</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {legalScripts.filter(s => s.active).map(s => (
                      <div key={s.id} className="flex items-start gap-2 max-w-xs text-left">
                        {s.image && <img src={s.image} alt={s.alt} style={{ width: Math.min(s.width, 120) }} className="rounded" />}
                        <p className="text-[10px] text-white/60">{s.id === "anpc-sal" ? footerTexts.sal_sublabel : footerTexts.sol_sublabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copyright */}
              <div className="border-t border-white/10 mt-4 pt-3 text-center text-[10px] text-white/40">
                <p>{footerTexts.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
                {footerTexts.extra_legal && <p className="mt-1">{footerTexts.extra_legal}</p>}
                {footerTexts.show_made_in && <p className="mt-1">Made with ❤️ în România</p>}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
