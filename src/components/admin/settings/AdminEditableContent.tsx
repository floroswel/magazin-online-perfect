import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Megaphone, Navigation, Layers, Award, Sparkles, Shield as ShieldIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EDITABLE_DEFAULTS, type EditableContent } from "@/hooks/useEditableContent";

const KEY_MAP: Record<keyof EditableContent, string> = {
  announcement: "editable_announcement",
  header_topbar: "editable_header_topbar",
  header_nav: "editable_header_nav",
  mobile_categories: "editable_mobile_categories",
  why_section: "editable_why_section",
  process_section: "editable_process_section",
  scent_promos: "editable_scent_promos",
  trust_strip: "editable_trust_strip",
  social_proof_static: "editable_social_proof_static",
};

export default function AdminEditableContent() {
  const [content, setContent] = useState<EditableContent>(EDITABLE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", Object.values(KEY_MAP))
      .then(({ data }) => {
        if (data && data.length > 0) {
          const updated = { ...EDITABLE_DEFAULTS };
          const reverseMap: Record<string, keyof EditableContent> = {};
          Object.entries(KEY_MAP).forEach(([k, v]) => { reverseMap[v] = k as keyof EditableContent; });
          data.forEach((row: any) => {
            const field = reverseMap[row.key];
            if (field && row.value_json != null) {
              (updated as any)[field] = row.value_json;
            }
          });
          setContent(updated);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    for (const [field, dbKey] of Object.entries(KEY_MAP)) {
      await supabase.from("app_settings").upsert(
        { key: dbKey, value_json: (content as any)[field] as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    setSaving(false);
    toast.success("Conținut editabil salvat! Schimbările apar pe site în câteva secunde.");
  };

  const set = <K extends keyof EditableContent>(key: K, val: EditableContent[K]) =>
    setContent(c => ({ ...c, [key]: val }));

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Editor Conținut Site</h1>
          <p className="text-sm text-muted-foreground">Editează orice text, link sau componentă de pe site</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvează Tot
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Announcement Bar */}
        <AccordionItem value="announcement">
          <AccordionTrigger className="text-sm font-semibold"><Megaphone className="w-4 h-4 mr-2 inline" /> Bara de Anunțuri</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 p-3">
              <div><Label>Text Desktop</Label><Input value={content.announcement.text_desktop} onChange={e => set("announcement", { ...content.announcement, text_desktop: e.target.value })} /><p className="text-xs text-muted-foreground">Folosește {"{threshold}"} pentru pragul în lei</p></div>
              <div><Label>Text Mobil</Label><Input value={content.announcement.text_mobile} onChange={e => set("announcement", { ...content.announcement, text_mobile: e.target.value })} /></div>
              <div><Label>Prag Livrare Gratuită (lei)</Label><Input type="number" value={content.announcement.threshold} onChange={e => set("announcement", { ...content.announcement, threshold: Number(e.target.value) })} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Topbar */}
        <AccordionItem value="topbar">
          <AccordionTrigger className="text-sm font-semibold"><Navigation className="w-4 h-4 mr-2 inline" /> Header Topbar</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 p-3">
              <div><Label>Telefon</Label><Input value={content.header_topbar.phone} onChange={e => set("header_topbar", { ...content.header_topbar, phone: e.target.value })} /></div>
              <div><Label>Text Livrare</Label><Input value={content.header_topbar.shipping_text} onChange={e => set("header_topbar", { ...content.header_topbar, shipping_text: e.target.value })} /></div>
              <div><Label>Locație</Label><Input value={content.header_topbar.location} onChange={e => set("header_topbar", { ...content.header_topbar, location: e.target.value })} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Nav Links */}
        <AccordionItem value="nav">
          <AccordionTrigger className="text-sm font-semibold"><Navigation className="w-4 h-4 mr-2 inline" /> Link-uri Navigare</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 p-3">
              {content.header_nav.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={link.label} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], label: e.target.value }; set("header_nav", nav); }} placeholder="Label" className="flex-1" />
                  <Input value={link.to} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], to: e.target.value }; set("header_nav", nav); }} placeholder="URL" className="flex-1" />
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!link.highlight} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], highlight: e.target.checked }; set("header_nav", nav); }} /> HL</label>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => set("header_nav", content.header_nav.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("header_nav", [...content.header_nav, { to: "/", label: "Nou", highlight: false }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Link</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Mobile Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-semibold"><Layers className="w-4 h-4 mr-2 inline" /> Categorii Mobile</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 p-3">
              {content.mobile_categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={cat.icon} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], icon: e.target.value }; set("mobile_categories", cats); }} className="w-14" placeholder="Icon" />
                  <Input value={cat.name} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], name: e.target.value }; set("mobile_categories", cats); }} placeholder="Nume" className="flex-1" />
                  <Input value={cat.slug} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], slug: e.target.value }; set("mobile_categories", cats); }} placeholder="Slug" className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => set("mobile_categories", content.mobile_categories.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("mobile_categories", [...content.mobile_categories, { name: "Nou", slug: "nou", icon: "📦" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Why Section */}
        <AccordionItem value="why">
          <AccordionTrigger className="text-sm font-semibold"><Sparkles className="w-4 h-4 mr-2 inline" /> Secțiunea "De Ce Noi"</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 p-3">
              <div><Label>Titlu secțiune</Label><Input value={content.why_section.title} onChange={e => set("why_section", { ...content.why_section, title: e.target.value })} /></div>
              {content.why_section.items.map((item, i) => (
                <Card key={i} className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Icon (Leaf/Hand/Palette/Truck)</Label><Input value={item.icon} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], icon: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                    <div><Label className="text-xs">Titlu</Label><Input value={item.title} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], title: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Input value={item.desc} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], desc: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Process Section */}
        <AccordionItem value="process">
          <AccordionTrigger className="text-sm font-semibold"><Layers className="w-4 h-4 mr-2 inline" /> Secțiunea Proces</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 p-3">
              <div><Label>Subtitlu</Label><Input value={content.process_section.subtitle} onChange={e => set("process_section", { ...content.process_section, subtitle: e.target.value })} /></div>
              <div><Label>Titlu</Label><Input value={content.process_section.title} onChange={e => set("process_section", { ...content.process_section, title: e.target.value })} /></div>
              {content.process_section.steps.map((step, i) => (
                <Card key={i} className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Nr.</Label><Input value={step.number} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], number: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                    <div className="col-span-2"><Label className="text-xs">Titlu</Label><Input value={step.title} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], title: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Input value={step.desc} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], desc: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Promo Banners */}
        <AccordionItem value="promos">
          <AccordionTrigger className="text-sm font-semibold"><Sparkles className="w-4 h-4 mr-2 inline" /> Bannere Promo (Scent Guide)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 p-3">
              {content.scent_promos.map((promo, i) => (
                <Card key={i} className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Titlu</Label><Input value={promo.title} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], title: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Subtitlu</Label><Input value={promo.subtitle} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], subtitle: e.target.value }; set("scent_promos", p); }} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">CTA text</Label><Input value={promo.cta} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], cta: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Link</Label><Input value={promo.link} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], link: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Imagine URL</Label><Input value={promo.image} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], image: e.target.value }; set("scent_promos", p); }} /></div>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Trust Strip */}
        <AccordionItem value="trust">
          <AccordionTrigger className="text-sm font-semibold"><ShieldIcon className="w-4 h-4 mr-2 inline" /> Trust Footer Strip</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 p-3">
              {content.trust_strip.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], icon: e.target.value }; set("trust_strip", t); }} className="w-28" placeholder="Icon" />
                  <Input value={item.title} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], title: e.target.value }; set("trust_strip", t); }} placeholder="Titlu" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], desc: e.target.value }; set("trust_strip", t); }} placeholder="Descriere" className="flex-1" />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Proof Static */}
        <AccordionItem value="social">
          <AccordionTrigger className="text-sm font-semibold"><Award className="w-4 h-4 mr-2 inline" /> Social Proof (Static)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 p-3">
              {content.social_proof_static.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], icon: e.target.value }; set("social_proof_static", s); }} className="w-28" placeholder="Icon" />
                  <Input value={item.label} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], label: e.target.value }; set("social_proof_static", s); }} placeholder="Label" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], desc: e.target.value }; set("social_proof_static", s); }} placeholder="Descriere" className="flex-1" />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
