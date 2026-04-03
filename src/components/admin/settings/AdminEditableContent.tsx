import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Save, Loader2, Plus, Trash2, Megaphone, Navigation, Layers,
  Award, Sparkles, Shield as ShieldIcon, Search, Eye, Settings,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EDITABLE_DEFAULTS, type EditableContent } from "@/hooks/useEditableContent";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_MAP: Record<keyof EditableContent, string> = {
  store_general: "editable_store_general",
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

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pb-1 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminEditableContent() {
  const [content, setContent] = useState<EditableContent>(EDITABLE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");

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
    const promises = Object.entries(KEY_MAP).map(([field, dbKey]) =>
      supabase.from("app_settings").upsert(
        { key: dbKey, value_json: (content as any)[field] as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
    );
    await Promise.all(promises);
    setSaving(false);
    toast.success("Salvat! Schimbările apar pe site în câteva secunde.");
  };

  const seedDefaults = async () => {
    setSeeding(true);
    const promises = Object.entries(KEY_MAP).map(([field, dbKey]) =>
      supabase.from("app_settings").upsert(
        { key: dbKey, value_json: (EDITABLE_DEFAULTS as any)[field] as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
    );
    await Promise.all(promises);
    setContent(EDITABLE_DEFAULTS);
    setSeeding(false);
    toast.success("Valorile implicite au fost scrise în baza de date. Sincronizarea este activă!");
  };

  const set = <K extends keyof EditableContent>(key: K, val: EditableContent[K]) =>
    setContent(c => ({ ...c, [key]: val }));

  const searchLower = search.toLowerCase();
  const matchesSearch = (text: string) => !search || text.toLowerCase().includes(searchLower);

  const tabVisibility = useMemo(() => ({
    general: !search || ["general", "magazin", "nume", "slogan", "email", "store"].some(k => matchesSearch(k)),
    header: !search || ["telefon", "livrare", "locatie", "navigare", "link", "categorii", "mobile", "header", "topbar", "phone"].some(k => matchesSearch(k)),
    promo: !search || ["anunt", "countdown", "prag", "banner", "promo", "scent"].some(k => matchesSearch(k)),
    sections: !search || ["why", "proces", "section", "de ce", "step"].some(k => matchesSearch(k)),
    trust: !search || ["trust", "social", "proof", "badge", "livrare", "retur", "plata"].some(k => matchesSearch(k)),
  }), [search]);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Editor Conținut Site
          </h1>
          <p className="text-sm text-muted-foreground">Editează orice text, link sau componentă de pe site – salvat în timp real</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={seedDefaults} disabled={seeding} size="sm" variant="outline">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Inițializează Valori Default
          </Button>
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Salvează Tot
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută setare..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          {tabVisibility.general && <TabsTrigger value="general" className="text-xs sm:text-sm"><Settings className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> General</TabsTrigger>}
          {tabVisibility.header && <TabsTrigger value="header" className="text-xs sm:text-sm"><Navigation className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Header</TabsTrigger>}
          {tabVisibility.promo && <TabsTrigger value="promo" className="text-xs sm:text-sm"><Megaphone className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Promoții</TabsTrigger>}
          {tabVisibility.sections && <TabsTrigger value="sections" className="text-xs sm:text-sm"><Layers className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Secțiuni</TabsTrigger>}
          {tabVisibility.trust && <TabsTrigger value="trust" className="text-xs sm:text-sm"><ShieldIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Trust</TabsTrigger>}
        </TabsList>

        {/* ═══ GENERAL ═══ */}
        <TabsContent value="general" className="space-y-3 mt-4">
          <Section title="Setări Generale Magazin" icon={Settings} defaultOpen>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Nume Magazin</Label><Input value={content.store_general.store_name} onChange={e => set("store_general", { ...content.store_general, store_name: e.target.value })} /></div>
              <div><Label>Slogan</Label><Input value={content.store_general.store_slogan} onChange={e => set("store_general", { ...content.store_general, store_slogan: e.target.value })} /></div>
            </div>
            <div className="mt-3"><Label>Email Contact</Label><Input value={content.store_general.store_email} onChange={e => set("store_general", { ...content.store_general, store_email: e.target.value })} /></div>
          </Section>
        </TabsContent>

        {/* ═══ HEADER & NAVIGATION ═══ */}
        <TabsContent value="header" className="space-y-3 mt-4">
          <Section title="Bara Superioară (Topbar)" icon={Navigation} defaultOpen>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Telefon</Label><Input value={content.header_topbar.phone} onChange={e => set("header_topbar", { ...content.header_topbar, phone: e.target.value })} /></div>
              <div><Label>Text Livrare</Label><Input value={content.header_topbar.shipping_text} onChange={e => set("header_topbar", { ...content.header_topbar, shipping_text: e.target.value })} /></div>
              <div><Label>Locație</Label><Input value={content.header_topbar.location} onChange={e => set("header_topbar", { ...content.header_topbar, location: e.target.value })} /></div>
            </div>
          </Section>

          <Section title="Link-uri Navigare" icon={Navigation}>
            <div className="space-y-2">
              {content.header_nav.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={link.label} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], label: e.target.value }; set("header_nav", nav); }} placeholder="Label" className="flex-1" />
                  <Input value={link.to} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], to: e.target.value }; set("header_nav", nav); }} placeholder="URL" className="flex-1" />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" checked={!!link.highlight} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], highlight: e.target.checked }; set("header_nav", nav); }} /> Evidențiat</label>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("header_nav", content.header_nav.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("header_nav", [...content.header_nav, { to: "/", label: "Nou", highlight: false }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Link</Button>
            </div>
          </Section>

          <Section title="Categorii Mobile" icon={Layers}>
            <div className="space-y-2">
              {content.mobile_categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={cat.icon} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], icon: e.target.value }; set("mobile_categories", cats); }} className="w-14" placeholder="🔥" />
                  <Input value={cat.name} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], name: e.target.value }; set("mobile_categories", cats); }} placeholder="Nume" className="flex-1" />
                  <Input value={cat.slug} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], slug: e.target.value }; set("mobile_categories", cats); }} placeholder="Slug" className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("mobile_categories", content.mobile_categories.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("mobile_categories", [...content.mobile_categories, { name: "Nou", slug: "nou", icon: "📦" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ═══ PROMOȚII & ANUNȚURI ═══ */}
        <TabsContent value="promo" className="space-y-3 mt-4">
          <Section title="Bara de Anunțuri (Countdown)" icon={Megaphone} defaultOpen>
            <div className="space-y-3">
              <div><Label>Text Desktop</Label><Textarea value={content.announcement.text_desktop} onChange={e => set("announcement", { ...content.announcement, text_desktop: e.target.value })} rows={2} /><p className="text-xs text-muted-foreground mt-1">Folosește {"{threshold}"} pentru pragul în lei</p></div>
              <div><Label>Text Mobil</Label><Textarea value={content.announcement.text_mobile} onChange={e => set("announcement", { ...content.announcement, text_mobile: e.target.value })} rows={2} /></div>
              <div className="max-w-[200px]"><Label>Prag Livrare Gratuită (lei)</Label><Input type="number" value={content.announcement.threshold} onChange={e => set("announcement", { ...content.announcement, threshold: Number(e.target.value) })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Culoare fundal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={content.announcement.bg_color || "#D9773F"} onChange={e => set("announcement", { ...content.announcement, bg_color: e.target.value })} className="w-9 h-9 rounded border cursor-pointer p-0" />
                    <Input value={content.announcement.bg_color || ""} onChange={e => set("announcement", { ...content.announcement, bg_color: e.target.value })} placeholder="#D9773F (implicit)" className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Culoare text</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={content.announcement.text_color || "#ffffff"} onChange={e => set("announcement", { ...content.announcement, text_color: e.target.value })} className="w-9 h-9 rounded border cursor-pointer p-0" />
                    <Input value={content.announcement.text_color || ""} onChange={e => set("announcement", { ...content.announcement, text_color: e.target.value })} placeholder="#ffffff (implicit)" className="h-8 text-xs font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="marquee-toggle" checked={!!content.announcement.marquee} onChange={e => set("announcement", { ...content.announcement, marquee: e.target.checked })} className="rounded" />
                <Label htmlFor="marquee-toggle" className="text-sm cursor-pointer">Text în mișcare (marquee dreapta → stânga)</Label>
              </div>
            </div>
          </Section>

          <Section title="Bannere Promo (Scent Guide)" icon={Sparkles}>
            <div className="space-y-3">
              {content.scent_promos.map((promo, i) => (
                <Card key={i} className="p-3 space-y-2 relative">
                  <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => set("scent_promos", content.scent_promos.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
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
              <Button size="sm" variant="outline" onClick={() => set("scent_promos", [...content.scent_promos, { title: "Nou", subtitle: "", cta: "Vezi", link: "/", image: "" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Banner</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ═══ SECȚIUNI HOMEPAGE ═══ */}
        <TabsContent value="sections" className="space-y-3 mt-4">
          <Section title='Secțiunea "De Ce Noi"' icon={Sparkles} defaultOpen>
            <div className="space-y-3">
              <div><Label>Titlu secțiune</Label><Input value={content.why_section.title} onChange={e => set("why_section", { ...content.why_section, title: e.target.value })} /></div>
              {content.why_section.items.map((item, i) => (
                <Card key={i} className="p-3 relative">
                  <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => set("why_section", { ...content.why_section, items: content.why_section.items.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Icon (Leaf/Hand/Palette/Truck)</Label><Input value={item.icon} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], icon: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                    <div><Label className="text-xs">Titlu</Label><Input value={item.title} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], title: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Textarea value={item.desc} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], desc: e.target.value }; set("why_section", { ...content.why_section, items }); }} rows={2} /></div>
                </Card>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("why_section", { ...content.why_section, items: [...content.why_section.items, { icon: "Sparkles", title: "Nou", desc: "" }] })}><Plus className="w-3 h-3 mr-1" /> Adaugă Element</Button>
            </div>
          </Section>

          <Section title="Secțiunea Proces (Pași)" icon={Layers}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtitlu</Label><Input value={content.process_section.subtitle} onChange={e => set("process_section", { ...content.process_section, subtitle: e.target.value })} /></div>
                <div><Label>Titlu</Label><Input value={content.process_section.title} onChange={e => set("process_section", { ...content.process_section, title: e.target.value })} /></div>
              </div>
              {content.process_section.steps.map((step, i) => (
                <Card key={i} className="p-3 relative">
                  <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => set("process_section", { ...content.process_section, steps: content.process_section.steps.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Nr.</Label><Input value={step.number} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], number: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                    <div className="col-span-2"><Label className="text-xs">Titlu</Label><Input value={step.title} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], title: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Textarea value={step.desc} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], desc: e.target.value }; set("process_section", { ...content.process_section, steps }); }} rows={2} /></div>
                </Card>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("process_section", { ...content.process_section, steps: [...content.process_section.steps, { number: String(content.process_section.steps.length + 1).padStart(2, "0"), title: "Nou", desc: "" }] })}><Plus className="w-3 h-3 mr-1" /> Adaugă Pas</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ═══ TRUST & SOCIAL PROOF ═══ */}
        <TabsContent value="trust" className="space-y-3 mt-4">
          <Section title="Trust Footer Strip (Badge-uri)" icon={ShieldIcon} defaultOpen>
            <div className="space-y-2">
              {content.trust_strip.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], icon: e.target.value }; set("trust_strip", t); }} className="w-28" placeholder="Icon" />
                  <Input value={item.title} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], title: e.target.value }; set("trust_strip", t); }} placeholder="Titlu" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], desc: e.target.value }; set("trust_strip", t); }} placeholder="Descriere" className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("trust_strip", content.trust_strip.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("trust_strip", [...content.trust_strip, { icon: "ShieldCheck", title: "Nou", desc: "" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Badge</Button>
            </div>
          </Section>

          <Section title="Social Proof (Static)" icon={Award}>
            <div className="space-y-2">
              {content.social_proof_static.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], icon: e.target.value }; set("social_proof_static", s); }} className="w-28" placeholder="Icon" />
                  <Input value={item.label} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], label: e.target.value }; set("social_proof_static", s); }} placeholder="Label" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], desc: e.target.value }; set("social_proof_static", s); }} placeholder="Descriere" className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("social_proof_static", content.social_proof_static.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("social_proof_static", [...content.social_proof_static, { icon: "Star", label: "Nou", desc: "" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă</Button>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
